export class CurvePoint {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

function getSlopes(curve: CurvePoint[]) {
  const slopes: number[] = [];

  for (let i = 0; i < curve.length - 1; i++) {
    const x1 = curve[i]!.x;
    const y1 = curve[i]!.y;
    const x2 = curve[i + 1]!.x;
    const y2 = curve[i + 1]!.y;
    slopes.push((y2 - y1) / (x2 - x1));
  }

  return slopes;
}

function getCurveMultiplier(
  curve: CurvePoint[],
  slopes: number[],
  acc: number,
): number {
  if (acc >= curve[curve.length - 1]!.x) {
    return curve[curve.length - 1]!.y;
  }

  if (acc <= 0) {
    return 0;
  }

  let i = -1;

  for (const point of curve) {
    if (point.x > acc) {
      break;
    }
    i++;
  }

  const lowerScore = curve[i]!.x;
  const lowerGiven = curve[i]!.y;

  return lerp(slopes, lowerScore, lowerGiven, acc, i);
}

function lerp(slopes: number[], x1: number, y1: number, x3: number, i: number) {
  const m = slopes[i]!;
  return m * (x3 - x1) + y1;
}

abstract class PPCalculator {
  private curve: CurvePoint[] = [];
  private slopes: number[] = [];

  constructor(curve: CurvePoint[]) {
    this.curve = curve;
    this.slopes = getSlopes(curve);
  }
}

export class APCalculator extends PPCalculator {
  private static curve = [
    new CurvePoint(0.0, 0.0),
    new CurvePoint(0.934905, 0.199540079),
    new CurvePoint(0.936109662, 0.205372691),
    new CurvePoint(0.9373169, 0.211205736),
    new CurvePoint(0.9385246, 0.217033356),
    new CurvePoint(0.939722359, 0.222809523),
    new CurvePoint(0.940932453, 0.228646174),
    new CurvePoint(0.9421365, 0.234458953),
    new CurvePoint(0.943340838, 0.2402832),
    new CurvePoint(0.944552839, 0.246159047),
    new CurvePoint(0.9457522, 0.251992941),
    new CurvePoint(0.9469653, 0.257918179),
    new CurvePoint(0.948161364, 0.2637897),
    new CurvePoint(0.949368238, 0.2697488),
    new CurvePoint(0.950574458, 0.275745422),
    new CurvePoint(0.951778352, 0.2817769),
    new CurvePoint(0.9529892, 0.287896276),
    new CurvePoint(0.9541947, 0.294047832),
    new CurvePoint(0.95540446, 0.3002878),
    new CurvePoint(0.956605434, 0.306556374),
    new CurvePoint(0.9578077, 0.312913179),
    new CurvePoint(0.959022164, 0.319426268),
    new CurvePoint(0.960223138, 0.3259672),
    new CurvePoint(0.961434, 0.332672924),
    new CurvePoint(0.962627947, 0.3394055),
    new CurvePoint(0.963842332, 0.34638828),
    new CurvePoint(0.9650501, 0.3534816),
    new CurvePoint(0.9662496, 0.360688),
    new CurvePoint(0.967453, 0.3680959),
    new CurvePoint(0.968659163, 0.375718385),
    new CurvePoint(0.9698669, 0.3835699),
    new CurvePoint(0.971075058, 0.3916664),
    new CurvePoint(0.972282469, 0.4000257),
    new CurvePoint(0.973487735, 0.4086676),
    new CurvePoint(0.974689662, 0.417614341),
    new CurvePoint(0.9759018, 0.427008361),
    new CurvePoint(0.9771083, 0.436772943),
    new CurvePoint(0.9783079, 0.44694218),
    new CurvePoint(0.979514539, 0.457693249),
    new CurvePoint(0.9807122, 0.468949974),
    new CurvePoint(0.9819304, 0.4810807),
    new CurvePoint(0.9831227, 0.493713439),
    new CurvePoint(0.9843344, 0.507437),
    new CurvePoint(0.985534549, 0.5220473),
    new CurvePoint(0.9867538, 0.538101852),
    new CurvePoint(0.9879462, 0.5551918),
    new CurvePoint(0.98915875, 0.5742497),
    new CurvePoint(0.990361631, 0.595172763),
    new CurvePoint(0.9915723, 0.6187205),
    new CurvePoint(0.992777944, 0.645271361),
    new CurvePoint(0.9939826, 0.6757583),
    new CurvePoint(0.9951928, 0.711631835),
    new CurvePoint(0.9963839, 0.7539894),
    new CurvePoint(0.9975978, 0.807864964),
    new CurvePoint(0.998801649, 0.8810363),
    new CurvePoint(0.9997989, 1.0),
  ];
  private static slopes = getSlopes(this.curve);
  private static scale = 61.0;
  private static shift = -18.0;

  public static getAP(complexity: number, acc: number) {
    return (
      getCurveMultiplier(this.curve, this.slopes, acc) *
      (complexity - this.shift) *
      this.scale
    );
  }
}

export class SSPPCalulator extends PPCalculator {
  private static curve = [
    new CurvePoint(0.0, 0.0),
    new CurvePoint(0.6, 0.182232335),
    new CurvePoint(0.65, 0.586601),
    new CurvePoint(0.7, 0.6125566),
    new CurvePoint(0.75, 0.6451808),
    new CurvePoint(0.8, 0.6872269),
    new CurvePoint(0.825, 0.7150466),
    new CurvePoint(0.85, 0.746229053),
    new CurvePoint(0.875, 0.781693459),
    new CurvePoint(0.9, 0.825756133),
    new CurvePoint(0.91, 0.8488376),
    new CurvePoint(0.92, 0.872871041),
    new CurvePoint(0.93, 0.9039994),
    new CurvePoint(0.94, 0.9417363),
    new CurvePoint(0.95, 1.0),
    new CurvePoint(0.955, 1.0388633),
    new CurvePoint(0.96, 1.08718836),
    new CurvePoint(0.965, 1.155212),
    new CurvePoint(0.97, 1.24858081),
    new CurvePoint(0.9725, 1.30903327),
    new CurvePoint(0.975, 1.38071024),
    new CurvePoint(0.9775, 1.46647263),
    new CurvePoint(0.98, 1.570241),
    new CurvePoint(0.9825, 1.69753623),
    new CurvePoint(0.985, 1.85638881),
    new CurvePoint(0.9875, 2.058947),
    new CurvePoint(0.99, 2.32450628),
    new CurvePoint(0.99125, 2.49029064),
    new CurvePoint(0.9925, 2.68566775),
    new CurvePoint(0.99375, 2.91901565),
    new CurvePoint(0.995, 3.20220184),
    new CurvePoint(0.99625, 3.55261445),
    new CurvePoint(0.9975, 3.99679351),
    new CurvePoint(0.99825, 4.32502747),
    new CurvePoint(0.999, 4.715471),
    new CurvePoint(0.9995, 5.01954365),
    new CurvePoint(1.0, 5.36739445),
  ];
  private static slopes = getSlopes(this.curve);

  public static getPP(
    rawPP: number,
    accuracy: number,
    failed: boolean,
  ): number {
    let multiplier = 1;
    if (failed) {
      multiplier = 0.5;
    }
    return (
      rawPP * getCurveMultiplier(this.curve, this.slopes, accuracy * multiplier)
    );
  }
}
