import {Component, OnDestroy, OnInit} from '@angular/core';
import {ImageService, UserImage} from "../services/image.service";
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

    constructor(protected imageService: ImageService,
                private actionSheetController: ActionSheetController,
                private imageCropper: NgxPhotoEditorService) {
    }

    async ngOnInit(): Promise<void> {
        await this.imageService.loadSaved();
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }

    protected onCameraClick(): void {
        this.imageService.addNewToGallery();
    }

    protected async onImageClick(photo: UserImage, position: number): Promise<void> {
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
                        this.imageService.deleteImage(photo, position);
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

    private cropImage(photo: UserImage, position: number): void {
        this.imageCropper.open(photo.webviewPath, {
            aspectRatio: 4 / 3,
            autoCropArea: 1
        }).subscribe((event: NgxCroppedEvent) => this.imageService.replacePhoto(photo, position, event.base64!));
    }
}
