import {Component, OnInit} from '@angular/core';
import {PhotoService} from "../services/photo.service";

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

    constructor(public photoService: PhotoService) {
    }

    async ngOnInit(): Promise<void> {
        await this.photoService.loadSaved();
    }

    onCameraClick(): void {
        this.photoService.addNewToGallery();
    }
}
