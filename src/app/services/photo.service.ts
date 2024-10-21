import {Injectable} from '@angular/core';
import {Camera, CameraResultType, CameraSource, Photo} from '@capacitor/camera';
import {Directory, Filesystem} from "@capacitor/filesystem";
import {Preferences} from "@capacitor/preferences";
import {Platform} from '@ionic/angular';
import {Capacitor} from "@capacitor/core";

@Injectable({
    providedIn: 'root'
})
export class PhotoService {

    photos: UserPhoto[] = [];
    private PHOTO_STORAGE: string = 'hoof-stamper-pictures';

    constructor(private platform: Platform) {
    }

    async addNewToGallery(): Promise<void> {
        // Take a photo
        const capturedPhoto = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100
        });

        // Save the picture and add it to photo collection
        const savedImageFile = await this.savePicture(capturedPhoto);
        this.addPhoto(savedImageFile);
    }

    async loadSaved(): Promise<void> {
        // Retrieve cached photo array data
        const {value} = await Preferences.get({key: this.PHOTO_STORAGE});
        const loadedPhotos = (value ? JSON.parse(value) : []) as UserPhoto[];

        // Easiest way to detect when running on the web:
        // “when the platform is NOT hybrid, do this”
        if (!this.isExecutedAsNativeApp()) {
            // Display the photo by reading into base64 format
            for (const photo of loadedPhotos) {
                // Read each saved photo's data from the Filesystem
                const readFile = await Filesystem.readFile({
                    path: photo.filepath,
                    directory: Directory.Data
                });

                // Web platform only: Load the photo as base64 data
                photo.webviewPath = this.createBase64String(readFile.data);
            }
        }

        this.photos = loadedPhotos;
    }

    async deletePicture(photo: UserPhoto, position: number): Promise<void> {
        // Remove this photo from the Photos reference data array
        this.photos.splice(position, 1);

        // Update photos array cache by overwriting the existing photo array
        Preferences.set({
            key: this.PHOTO_STORAGE,
            value: JSON.stringify(this.photos)
        });

        // delete photo file from filesystem
        const filename = photo.filepath
            .substring(photo.filepath.lastIndexOf('/') + 1);

        await Filesystem.deleteFile({
            path: filename,
            directory: Directory.Data
        });
    }

    async replacePhoto(originalPhoto: UserPhoto, position: number, photoDataBase64: string): Promise<void> {
        const deletePicPromise = this.deletePicture(originalPhoto, position);
        console.log(photoDataBase64);
        const saveNewPicPromise = this.savePictureFromBase64Data(photoDataBase64);

        return deletePicPromise
            .then(() => saveNewPicPromise)
            .then((userPhoto: UserPhoto) => {
                this.addPhoto(userPhoto);
            });
    }

    private isExecutedAsNativeApp(): boolean {
        return this.platform.is('hybrid');
    }

    private addPhoto(userPhoto: UserPhoto): void {
        this.photos.unshift(userPhoto);

        // the Photos array is stored each time a new photo is taken
        Preferences.set({
            key: this.PHOTO_STORAGE,
            value: JSON.stringify(this.photos),
        });
    }

    private async savePicture(photo: Photo): Promise<UserPhoto> {
        return this.readAsBase64(photo).then((base64Data) => this.savePictureFromBase64Data(base64Data));
    }


    private async savePictureFromBase64Data(base64Data: string | Blob): Promise<UserPhoto> {
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
        // "hybrid" will detect Cordova or Capacitor
        if (this.isExecutedAsNativeApp()) {
            // Read the file into base64 format
            const file = await Filesystem.readFile({
                path: photo.path!
            });

            return file.data;
        } else {
            // Fetch the photo, read as a blob, then convert to base64 format
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

export interface UserPhoto {
    filepath: string;
    webviewPath?: string;
}
