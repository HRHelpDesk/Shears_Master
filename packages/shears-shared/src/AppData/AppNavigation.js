// app-data.js


import { Wigventory } from './AppStructures/Wigventory/Wigventory.js';
import { Shear } from './AppStructures/Shear/shear.js';
import { InfluencerApp } from './AppStructures/Wigfluencer/influencer.js';
export const AppData = [
  ...Shear,
  ...Wigventory,
  ...InfluencerApp
];