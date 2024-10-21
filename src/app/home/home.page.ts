import {Component, OnInit} from '@angular/core';
import {PhotoService, UserPhoto} from "../services/photo.service";
import {ActionSheetController} from "@ionic/angular";

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

    constructor(public photoService: PhotoService,
                private actionSheetController: ActionSheetController) {
    }

    async ngOnInit(): Promise<void> {
        await this.photoService.loadSaved();
    }

    onCameraClick(): void {
        this.photoService.addNewToGallery();
    }

    async onImageClick(photo: UserPhoto, position: number): Promise<void> {
        const actionSheet = await this.actionSheetController.create({
            header: 'Photos',
            buttons: [{
                text: 'Delete',
                role: 'destructive',
                icon: 'trash',
                handler: (): void => {
                    this.photoService.deletePicture(photo, position);
                }
            }, {
                text: 'Cancel',
                icon: 'close',
                role: 'cancel',
                handler: (): void => {
                    // Nothing to do, action sheet is automatically closed
                }
            }]
        });
        await actionSheet.present();
    }
}
