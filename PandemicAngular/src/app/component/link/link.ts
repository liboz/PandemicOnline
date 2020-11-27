interface Coordinates {
  x: number;
  y: number;
}

export default interface Link {
  source: Coordinates;
  target: Coordinates;
}
