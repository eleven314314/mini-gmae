import { CakeFlavor } from '../types/game';

export const LOGICAL_WIDTH = 380;
export const LOGICAL_HEIGHT = 640;

export const GROUND_Y = 576;
export const CAKE_HEIGHT = 44;
export const INITIAL_CAKE_WIDTH = 176;
export const MAX_CAKE_WIDTH = 216;
export const WIDEN_AMOUNT = 46;
export const MAX_POWERUP_CHARGES = 3;
export const MIN_SURVIVAL_WIDTH = 4;
export const PERFECT_TOLERANCE = 5.5;

export const PENDULUM_PIVOT_X = LOGICAL_WIDTH / 2;
export const PENDULUM_PIVOT_Y = -28;
export const PENDULUM_ROPE_LENGTH = 150;
export const PENDULUM_MAX_ANGLE = 0.65;

export const GRAVITY = 2200;
export const DEBRIS_GRAVITY = 1550;

export const KAWAII_FLAVORS: CakeFlavor[] = [
  {
    id: 'strawberry',
    name: '草莓鮮奶油',
    spongeColor: '#FFD6E0',
    spongeShade: '#F8B4C6',
    frostingColor: '#FFF7FA',
    frostingHighlight: '#FFFFFF',
    accentColor: '#F43F7E',
    cheekColor: '#FF9BB8',
    expression: 'happy',
    topping: 'strawberry',
  },
  {
    id: 'matcha',
    name: '宇治抹茶奶霜',
    spongeColor: '#CDEAC0',
    spongeShade: '#A9D696',
    frostingColor: '#F6FCEF',
    frostingHighlight: '#FFFFFF',
    accentColor: '#4D9B56',
    cheekColor: '#FFAEBC',
    expression: 'uwu',
    topping: 'matcha_leaf',
  },
  {
    id: 'lemon',
    name: '蜂蜜檸檬卡士達',
    spongeColor: '#FFF0A5',
    spongeShade: '#F7D96F',
    frostingColor: '#FFFDF2',
    frostingHighlight: '#FFFFFF',
    accentColor: '#F59E0B',
    cheekColor: '#FFA8B8',
    expression: 'wink',
    topping: 'stars',
  },
  {
    id: 'blueberry',
    name: '藍莓優格慕斯',
    spongeColor: '#C9E4FA',
    spongeShade: '#9BCBF4',
    frostingColor: '#F5FAFF',
    frostingHighlight: '#FFFFFF',
    accentColor: '#5B8DEF',
    cheekColor: '#FFB3C6',
    expression: 'happy',
    topping: 'blueberry',
  },
  {
    id: 'taro',
    name: '香芋紫薯蛋糕',
    spongeColor: '#E4CEF8',
    spongeShade: '#C7A4EB',
    frostingColor: '#FAF5FF',
    frostingHighlight: '#FFFFFF',
    accentColor: '#9B6EE8',
    cheekColor: '#FFA6C1',
    expression: 'bliss',
    topping: 'sprinkles',
  },
  {
    id: 'caramel',
    name: '焦糖海鹽布丁',
    spongeColor: '#FAD7B4',
    spongeShade: '#F0B680',
    frostingColor: '#FFF9F0',
    frostingHighlight: '#FFFFFF',
    accentColor: '#D97706',
    cheekColor: '#FF9EAB',
    expression: 'uwu',
    topping: 'caramel_pearl',
  },
  {
    id: 'peach',
    name: '白桃烏龍戚風',
    spongeColor: '#FFD7C4',
    spongeShade: '#F6B293',
    frostingColor: '#FFF9F6',
    frostingHighlight: '#FFFFFF',
    accentColor: '#FB7185',
    cheekColor: '#FF9AB0',
    expression: 'wink',
    topping: 'sprinkles',
  },
];

export function getFlavorForFloor(floorIndex: number): CakeFlavor {
  return KAWAII_FLAVORS[floorIndex % KAWAII_FLAVORS.length];
}

export function getAngularSpeedForFloor(floorsPlaced: number): number {
  return 2.1 + Math.min(3.7, floorsPlaced * 0.13 + Math.sqrt(floorsPlaced) * 0.24);
}
