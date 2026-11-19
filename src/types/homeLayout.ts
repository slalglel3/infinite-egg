import { HomeTabType } from './game';

export type WireframeElementKind =
  | 'card'
  | 'button'
  | 'play-button'
  | 'avatar'
  | 'progress'
  | 'segmented'
  | 'slot-grid'
  | 'list-row'
  | 'banner'
  | 'badge'
  | 'text';

export interface HomeLayoutElement {
  id: string;
  name: string;
  description: string;
  kind: WireframeElementKind;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
}

export type HomeTabsLayoutMap = Record<HomeTabType, HomeLayoutElement[]>;

export type ResizeHandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export type LayerAction = 'TOP' | 'UP' | 'DOWN' | 'BOTTOM';
