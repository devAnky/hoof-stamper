import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ImageService, UserImage} from "../services/image.service";
import {from, Subscription, switchMap} from "rxjs";
import {CanvasService, CanvasSticker, Hoof, SIZE_LARGE, StickerPosition, Trim} from "../services/canvas.service";
import {DateTime} from "ts-luxon";

const CANVAS_ID: string = 'image-canvas';

interface MaxDimensions {
    height: number;
    width: number;
}

function getMaxDimensions(): MaxDimensions {
    const element = document.getElementById('canvas-wrapper');
    if (element) {
        return {width: element.offsetWidth, height: element.offsetHeight};
    }
    return {width: 600, height: 600}
}

function drawImageScaled(img: HTMLImageElement, ctx: CanvasRenderingContext2D): void {
    const canvas = ctx.canvas;
    const maxDimensions = getMaxDimensions();
    const hRatio = maxDimensions.width / img.width;
    const vRatio = maxDimensions.height / img.height;
    const ratio = Math.min(hRatio, vRatio);
    canvas.width = img.width * ratio - 2;
    canvas.height = img.height * ratio - 2;

    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.width, img.height,
        centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
}

@Component({
    selector: 'app-canvas',
    templateUrl: './canvas.page.html',
    styleUrls: ['./canvas.page.scss'],
})
export class CanvasPage implements OnInit, OnDestroy {

    protected readonly Hoof = Hoof
    protected image: UserImage | null = null;
    private readonly subs = new Subscription();


    constructor(private activatedRoute: ActivatedRoute,
                private imageService: ImageService,
                private canvasService: CanvasService) {
    }

    ngOnInit(): void {
        this.subs.add(
            from(this.imageService.loadSaved()).pipe(
                switchMap(() =>
                    this.activatedRoute.params)).subscribe(params => {
                const index: number = params['position'];
                console.log(index)
                this.image = this.imageService.images[index];

                const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
                const ctx = canvas.getContext('2d')!;
                const image = new Image();
                image.onload = drawImageScaled.bind(null, image, ctx);
                image.src = this.image.webviewPath as string;
            })
        );
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }

    protected onFootClick(hoof: Hoof): void {
        const sticker: CanvasSticker = {
            hoof,
            color: 'black',
            backgroundColor: 'yellow',
            date: DateTime.now(),
            trim: Trim.POST_TRIM,
            position: StickerPosition.TOP_LEFT,
            size: SIZE_LARGE
        }
        this.draw(sticker);
    }

    private draw(sticker: CanvasSticker): void {
        const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
        this.canvasService.draw(canvas, sticker);
    }
}

