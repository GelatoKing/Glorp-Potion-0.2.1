
export interface ImageState {
  file: File | null;
  preview: string | null;
}

export interface TransformationResult {
  imageUrl: string | null;
  text: string | null;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}
