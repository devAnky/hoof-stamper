import {Injectable} from '@angular/core';
import {Camera, CameraResultType, CameraSource, Photo} from '@capacitor/camera';
import {Directory, Filesystem} from "@capacitor/filesystem";
import {Preferences} from "@capacitor/preferences";
import {Platform} from '@ionic/angular';
import {Capacitor} from "@capacitor/core";

@Injectable({
    providedIn: 'root'
})
export class ImageService {

    images: UserImage[] = [];
    private readonly IMAGE_STORAGE_KEY: string = 'hoof-stamper-images';

    constructor(private platform: Platform) {
    }

    async addNewToGallery(): Promise<void> {
        // Take a photo
        const capturedPhoto = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100
        });

        // Save the image and add it to image collection
        const savedImageFile = await this.saveImage(capturedPhoto);
        this.addImage(savedImageFile);
    }

    async loadSaved(): Promise<void> {
        // Retrieve cached image array data
        const {value} = await Preferences.get({key: this.IMAGE_STORAGE_KEY});
        const loadedImages = (value ? JSON.parse(value) : []) as UserImage[];

        if (!this.isExecutedAsNativeApp()) {
            // Display the image by reading into base64 format
            for (const image of loadedImages) {
                // Read each saved image's data from the Filesystem
                const readFile = await Filesystem.readFile({
                    path: image.filepath,
                    directory: Directory.Data
                });

                // Web platform only: Load the photo as base64 data
                image.webviewPath = this.createBase64String(readFile.data);
            }
        }

        this.images = loadedImages;
    }

    async deleteImage(image: UserImage, position: number): Promise<void> {
        this.images.splice(position, 1);

        Preferences.set({
            key: this.IMAGE_STORAGE_KEY,
            value: JSON.stringify(this.images)
        });

        // delete image file from filesystem
        const filename = image.filepath
            .substring(image.filepath.lastIndexOf('/') + 1);

        await Filesystem.deleteFile({
            path: filename,
            directory: Directory.Data
        });
    }

    async replacePhoto(originalImage: UserImage, position: number, dataBase64: string): Promise<void> {
        const deleteImgPromise = this.deleteImage(originalImage, position);
        const saveNewImgPromise = this.saveImageFromBase64Data(dataBase64);

        return deleteImgPromise
            .then(() => saveNewImgPromise)
            .then((userImage: UserImage) => {
                this.addImage(userImage);
            });
    }

    private isExecutedAsNativeApp(): boolean {
        return this.platform.is('hybrid');
    }

    private addImage(userImage: UserImage): void {
        this.images.unshift(userImage);

        // the images array is stored each time a new image is taken
        Preferences.set({
            key: this.IMAGE_STORAGE_KEY,
            value: JSON.stringify(this.images),
        });
    }

    private async saveImage(photo: Photo): Promise<UserImage> {
        return this.readAsBase64(photo).then((base64Data) => this.saveImageFromBase64Data(base64Data));
    }

    private async saveImageFromBase64Data(base64Data: string | Blob): Promise<UserImage> {
        // Write the file to the data directory
        const fileName = Date.now() + '.jpeg';
        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Data
        });

        if (this.isExecutedAsNativeApp()) {
            // Display the new image by rewriting the 'file://' path to HTTP
            // Details: https://ionicframework.com/docs/building/webview#file-protocol
            return {
                filepath: savedFile.uri,
                webviewPath: Capacitor.convertFileSrc(savedFile.uri),
            };
        } else {
            // Use webPath to display the new image instead of base64 since it's
            // already loaded into memory
            return {
                filepath: fileName,
                webviewPath: base64Data as string
            };
        }
    }

    private createBase64String(data: string | Blob): string {
        return `data:image/jpeg;base64,${data}`;
    }

    private async readAsBase64(photo: Photo): Promise<string | Blob> {
        if (this.isExecutedAsNativeApp()) {
            // Read the file into base64 format
            const file = await Filesystem.readFile({
                path: photo.path!
            });

            return file.data;
        } else {
            // Fetch the image, read as a blob, then convert to base64 format
            const response = await fetch(photo.webPath!);
            const blob = await response.blob();

            return await this.convertBlobToBase64(blob) as string;
        }
    }

    private convertBlobToBase64 = (blob: Blob): Promise<string | ArrayBuffer | null> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (): void => {
            resolve(reader.result);
        };
        reader.readAsDataURL(blob);
    });
}

export interface UserImage {
    filepath: string;
    webviewPath?: string;
}
