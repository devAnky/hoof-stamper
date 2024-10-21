import {Component, OnDestroy, OnInit} from '@angular/core';
import {PhotoService, UserPhoto} from "../services/photo.service";
import {ActionSheetController} from "@ionic/angular";
import {NgxCroppedEvent, NgxPhotoEditorService} from "ngx-photo-editor";
import {Subscription} from "rxjs";

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

    private readonly subs = new Subscription();

    constructor(protected photoService: PhotoService,
                private actionSheetController: ActionSheetController,
                private photoEditor: NgxPhotoEditorService) {
    }

    async ngOnInit(): Promise<void> {
        await this.photoService.loadSaved();
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }

    protected onCameraClick(): void {
        this.photoService.addNewToGallery();
    }

    protected async onImageClick(photo: UserPhoto, position: number): Promise<void> {
        const actionSheet = await this.actionSheetController.create({
            header: 'Photos',
            buttons: [{
                text: 'Crop',
                role: 'button',
                icon: 'crop',
                handler: (): void => {
                    this.cropImage(photo, position);
                }
            },
                {
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

    private cropImage(photo: UserPhoto, position: number): void {
        this.photoEditor.open(photo.webviewPath, {
            aspectRatio: 4 / 3,
            autoCropArea: 1
        }).subscribe((event: NgxCroppedEvent) => this.photoService.replacePhoto(photo, position, event.base64!));
    }
}
