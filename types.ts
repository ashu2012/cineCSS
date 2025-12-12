export enum SceneType {
  HAL_9000 = 'HAL_9000',
  MATRIX = 'MATRIX',
  MATRIX_PILLS = 'MATRIX_PILLS',
  HYPERSPACE = 'HYPERSPACE',
  NOIR = 'NOIR',
  STOCK_NAP = 'STOCK_NAP',
  NEWSPAPER = 'NEWSPAPER',
  NEWSPAPER_AIRPLANE = 'NEWSPAPER_AIRPLANE',
  COMMERCE_SHOWCASE = 'COMMERCE_SHOWCASE',
  AI_DIRECTOR = 'AI_DIRECTOR',
  DOCUMENTATION = 'DOCUMENTATION'
}

export interface SceneConfig {
  id: SceneType;
  title: string;
  movie: string;
  year: string;
  description: string;
}

export interface DirectorParams {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  animationSpeed: 'slow' | 'medium' | 'fast';
  shape: 'circle' | 'square' | 'line';
  moodDescription: string;
}

export interface DirectorResponse {
  params: DirectorParams;
}