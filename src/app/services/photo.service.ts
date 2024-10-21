import {Injectable} from '@angular/core';
import {Camera, CameraResultType, CameraSource, Photo} from '@capacitor/camera';
import {Directory, Filesystem} from "@capacitor/filesystem";
import {Preferences} from "@capacitor/preferences";

@Injectable({
    providedIn: 'root'
})
export class PhotoService {

    photos: UserPhoto[] = [];
    private PHOTO_STORAGE: string = 'photos';

    constructor() {
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
        this.photos.unshift(savedImageFile);

        // the Photos array is stored each time a new photo is taken
        Preferences.set({
            key: this.PHOTO_STORAGE,
            value: JSON.stringify(this.photos),
        });
    }

    async loadSaved(): Promise<void> {
        // Retrieve cached photo array data
        const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
        this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];

        // Display the photo by reading into base64 format
        for (const photo of this.photos) {
            // Read each saved photo's data from the Filesystem
            const readFile = await Filesystem.readFile({
                path: photo.filepath,
                directory: Directory.Data,
            });

            // Web platform only: Load the photo as base64 data
            photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
        }
    }

    private async savePicture(photo: Photo): Promise<UserPhoto> {
        // Convert photo to base64 format, required by Filesystem API to save
        const base64Data = await this.readAsBase64(photo);

        // Write the file to the data directory
        const fileName = Date.now() + '.jpeg';
        await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Data
        });

        // Use webPath to display the new image instead of base64 since it's
        // already loaded into memory
        return {
            filepath: fileName,
            webviewPath: photo.webPath
        };
    }

    private async readAsBase64(photo: Photo): Promise<string> {
        // Fetch the photo, read as a blob, then convert to base64 format
        const response = await fetch(photo.webPath!);
        const blob = await response.blob();

        return await this.convertBlobToBase64(blob) as string;
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
