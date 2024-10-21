import {Injectable} from '@angular/core';
import {DateTime} from "ts-luxon";

export const SIZE_SMALL = 16;
export const SIZE_MEDIUM = 12;
export const SIZE_LARGE = 8;

function calcTextWidthAndHeight(text: string, fontSize: number): { height: number, width: number } {
    const d1 = document.createElement('div');
    d1.id = 'test3';
    d1.innerHTML = 'test';
    d1.style.width = 'fit-content';
    d1.style.padding = '0';
    d1.style.margin = '0';
    d1.style.fontSize = fontSize + 'px';

    document.documentElement.appendChild(d1);
    d1.innerHTML = text;
    return {width: d1.getBoundingClientRect().width, height: d1.getBoundingClientRect().height};
}

function getLongestText(texts: string[]): string {
    let longest = '';

    texts.forEach(text => {
        if (longest.length < text.length) {
            longest = text;
        }
    })

    return longest;
}

@Injectable({
    providedIn: 'root'
})
export class CanvasService {

    draw(canvas: HTMLCanvasElement, sticker: CanvasSticker): void {
        const ctx = canvas.getContext('2d')!;

        const texts: string[] = [sticker.date.toISODate(), sticker.hoof, sticker.trim];
        const fontSize = this.calcFontSize(canvas.height, sticker.size);
        const fontSpacing = 5;
        const rectPosX = 20;
        const rectPosY = 20;
        const textWidthAndHeight = calcTextWidthAndHeight(getLongestText(texts), fontSize);
        const rectWidth = textWidthAndHeight.width + 2 * fontSpacing;
        const rectHeight = textWidthAndHeight.height * texts.length + 2 * fontSpacing;
        // rect
        ctx.fillStyle = sticker.backgroundColor;
        ctx.fillRect(rectPosX, rectPosY, rectWidth, rectHeight);

        // text
        ctx.font = fontSize + 'px Arial';
        ctx.fillStyle = sticker.color;
        ctx.fillText(sticker.date.toISODate(), rectPosX + fontSpacing, rectPosY + fontSize);
        ctx.fillText(sticker.hoof, rectPosX + fontSpacing, rectPosY + 2 * fontSize + fontSpacing);
        ctx.fillText(sticker.trim, rectPosX + fontSpacing, rectPosY + 3 * fontSize + 2 * fontSpacing);
    }

    private calcFontSize(canvasHeight: number, size: number): number {
        const rows = 3;
        return canvasHeight / rows / size;
    }
}

export interface CanvasSticker {
    date: DateTime;
    color: string;
    backgroundColor: string;
    hoof: Hoof,
    trim: Trim,
    position: StickerPosition,
    size: number;
}

export enum Hoof {
    LEFT_FRONT = 'LF',
    RIGHT_FRONT = 'RF',
    LEFT_HIND = 'LH',
    RIGHT_HIND = 'RH'
}

export enum Trim {
    PRE_TRIM = 'pre trim',
    POST_TRIM = 'post trim',
    TOUCH_UP = 'touch up'
}


export enum StickerPosition {
    TOP_LEFT,
    TOP_RIGHT,
    BOTTOM_LEFT,
    BOTTOM_RIGHT
}