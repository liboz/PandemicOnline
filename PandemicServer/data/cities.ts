import { Client } from "pandemiccommon/dist/out-tsc";

export interface CityData {
  name: string;
  location: [number, number];
  color: Client.Color;
  adjacent: string[];
}

export const Cities: CityData[] = [
  {
    name: "Algiers",
    location: [8.058756, 30.753768], //[3.058756, 36.753768]
    color: Client.Color.Black,
    adjacent: ["Madrid", "Paris", "Istanbul", "Cairo"],
  },
  {
    name: "Atlanta",
    location: [-84.387982, 33.748995],
    color: Client.Color.Blue,
    adjacent: ["Chicago", "Washington", "Miami"],
  },
  {
    name: "Baghdad",
    location: [44.361488, 33.312806],
    color: Client.Color.Black,
    adjacent: ["Tehran", "Karachi", "Riyadh", "Cairo", "Istanbul"],
  },
  {
    name: "Bangkok",
    location: [100.501765, 13.756331],
    color: Client.Color.Red,
    adjacent: [
      "Kolkata",
      "Hong Kong",
      "Ho Chi Minh City",
      "Jakarta",
      "Chennai",
    ],
  },
  {
    name: "Beijing",
    location: [108.407396, 47.9042], //[116.407396, 39.9042]
    color: Client.Color.Red,
    adjacent: ["Seoul", "Shanghai"],
  },
  {
    name: "Bogota",
    location: [-74.072092, 4.710989],
    color: Client.Color.Yellow,
    adjacent: ["Mexico City", "Miami", "Sao Paulo", "Buenos Aires", "Lima"],
  },
  {
    name: "Buenos Aires",
    location: [-58.381559, -34.603684],
    color: Client.Color.Yellow,
    adjacent: ["Sao Paulo", "Bogota"],
  },
  {
    name: "Cairo",
    location: [31.235712, 30.04442],
    color: Client.Color.Black,
    adjacent: ["Istanbul", "Baghdad", "Riyadh", "Khartoum", "Algiers"],
  },
  {
    name: "Chennai",
    location: [85.270718, 8.08268], //[80.270718, 13.08268]
    color: Client.Color.Black,
    adjacent: ["Delhi", "Kolkata", "Bangkok", "Jakarta", "Mumbai"],
  },
  {
    name: "Chicago",
    location: [-90.629798, 44.878114], // [-87.629798, 41.878114]
    color: Client.Color.Blue,
    adjacent: [
      "Montreal",
      "Atlanta",
      "Mexico City",
      "Los Angeles",
      "San Francisco",
    ],
  },
  {
    name: "Delhi",
    location: [77.10249, 28.704059],
    color: Client.Color.Black,
    adjacent: ["Kolkata", "Tehran", "Karachi", "Mumbai", "Chennai"],
  },
  {
    name: "Essen",
    location: [12.011555, 57.455643], //[7.011555, 51.455643]
    color: Client.Color.Blue,
    adjacent: ["St Petersburg", "Milan", "Paris", "London"],
  },
  {
    name: "Ho Chi Minh City",
    location: [115.629664, 3.823099], //[106.629664, 10.823099]
    color: Client.Color.Red,
    adjacent: ["Hong Kong", "Manila", "Jakarta", "Bangkok"],
  },
  {
    name: "Hong Kong",
    location: [112.109497, 25.396428], //[114.109497, 22.396428]
    color: Client.Color.Red,
    adjacent: [
      "Shanghai",
      "Taipei",
      "Manila",
      "Ho Chi Minh City",
      "Bangkok",
      "Kolkata",
    ],
  },
  {
    name: "Istanbul",
    location: [28.978359, 41.008238],
    color: Client.Color.Black,
    adjacent: [
      "St Petersburg",
      "Moscow",
      "Baghdad",
      "Cairo",
      "Algiers",
      "Milan",
    ],
  },
  {
    name: "Jakarta",
    location: [106.865039, -6.17511],
    color: Client.Color.Red,
    adjacent: ["Bangkok", "Ho Chi Minh City", "Sydney", "Chennai"],
  },
  {
    name: "Johannesburg",
    location: [28.047305, -26.204103],
    color: Client.Color.Yellow,
    adjacent: ["Khartoum", "Kinshasa"],
  },
  {
    name: "Karachi",
    location: [64.009939, 24.861462], //[67.009939, 24.861462]
    color: Client.Color.Black,
    adjacent: ["Tehran", "Delhi", "Mumbai", "Riyadh", "Baghdad"],
  },
  {
    name: "Khartoum",
    location: [28.559899, 15.500654], //[32.559899, 15.500654]
    color: Client.Color.Yellow,
    adjacent: ["Cairo", "Johannesburg", "Kinshasa", "Lagos"],
  },
  {
    name: "Kinshasa",
    location: [15.266293, -7.441931], //[15.266293, -4.441931]
    color: Client.Color.Yellow,
    adjacent: ["Lagos", "Khartoum", "Johannesburg"],
  },
  {
    name: "Kolkata",
    location: [88.363895, 22.572646],
    color: Client.Color.Black,
    adjacent: ["Delhi", "Hong Kong", "Bangkok", "Chennai"],
  },
  {
    name: "Lagos",
    location: [3.379206, 6.524379],
    color: Client.Color.Yellow,
    adjacent: ["Sao Paulo", "Kinshasa", "Khartoum"],
  },
  {
    name: "Lima",
    location: [-77.042754, -12.046373],
    color: Client.Color.Yellow,
    adjacent: ["Mexico City", "Bogota", "Santiago"],
  },
  {
    name: "London",
    location: [-15.127758, 51.507351], //[-0.127758, 51.507351]
    color: Client.Color.Blue,
    adjacent: ["New York", "Madrid", "Paris", "Essen"],
  },
  {
    name: "Los Angeles",
    location: [-118.243685, 24.052234], // [-118.243685, 34.052234]
    color: Client.Color.Yellow,
    adjacent: ["San Francisco", "Sydney", "Mexico City", "Chicago"],
  },
  {
    name: "Madrid",
    location: [-8.70379, 40.416775], //[-3.70379, 40.416775]
    color: Client.Color.Blue,
    adjacent: ["London", "Paris", "Algiers", "Sao Paulo", "New York"],
  },
  {
    name: "Manila",
    location: [120.98422, 14.599512],
    color: Client.Color.Red,
    adjacent: [
      "Taipei",
      "San Francisco",
      "Sydney",
      "Ho Chi Minh City",
      "Hong Kong",
    ],
  },
  {
    name: "Mexico City",
    location: [-99.133208, 19.432608],
    color: Client.Color.Yellow,
    adjacent: ["Chicago", "Miami", "Bogota", "Lima", "Los Angeles"],
  },
  {
    name: "Miami",
    location: [-75.19179, 20.76168], //[-80.19179, 25.76168]
    color: Client.Color.Yellow,
    adjacent: ["Atlanta", "Washington", "Bogota", "Mexico City"],
  },
  {
    name: "Milan",
    location: [14.189982, 42.464204], //[9.189982, 45.464204]
    color: Client.Color.Blue,
    adjacent: ["Essen", "Istanbul", "Paris"],
  },
  {
    name: "Montreal",
    location: [-75.567256, 50.501689], // [-73.567256, 45.501689]
    color: Client.Color.Blue,
    adjacent: ["New York", "Washington", "Chicago"],
  },
  {
    name: "Moscow",
    location: [39.6173, 50.755826], //[37.6173, 55.755826]
    color: Client.Color.Black,
    adjacent: ["St Petersburg", "Tehran", "Istanbul"],
  },
  {
    name: "Mumbai",
    location: [70.877656, 12.075984], //[72.877656, 19.075984]
    color: Client.Color.Black,
    adjacent: ["Karachi", "Delhi", "Chennai"],
  },
  {
    name: "New York",
    location: [-62.005941, 45.712784], //[-74.005941, 40.712784]
    color: Client.Color.Blue,
    adjacent: ["Montreal", "London", "Madrid", "Washington"],
  },
  {
    name: "Osaka",
    location: [140.502165, 34.693738], //[135.502165, 34.693738]
    color: Client.Color.Red,
    adjacent: ["Tokyo", "Taipei"],
  },
  {
    name: "Paris",
    location: [2.352222, 48.856614],
    color: Client.Color.Blue,
    adjacent: ["London", "Essen", "Milan", "Algiers", "Madrid"],
  },
  {
    name: "Riyadh",
    location: [46.675296, 18.713552], //[46.675296, 24.713552]
    color: Client.Color.Black,
    adjacent: ["Baghdad", "Karachi", "Cairo"],
  },
  {
    name: "San Francisco",
    location: [-122.419416, 37.77493],
    color: Client.Color.Blue,
    adjacent: ["Tokyo", "Manila", "Los Angeles", "Chicago"],
  },
  {
    name: "Santiago",
    location: [-75.669265, -33.44889], // [-70.669265, -33.44889]
    color: Client.Color.Yellow,
    adjacent: ["Lima"],
  },
  {
    name: "Sao Paulo",
    location: [-46.633309, -23.55052],
    color: Client.Color.Yellow,
    adjacent: ["Madrid", "Lagos", "Buenos Aires", "Bogota"],
  },
  {
    name: "Seoul",
    location: [125.977969, 48.566535], //[126.977969, 37.566535]
    color: Client.Color.Red,
    adjacent: ["Beijing", "Tokyo", "Shanghai"],
  },
  {
    name: "Shanghai",
    location: [110.473702, 37.23039], //[121.473702, 31.23039]
    color: Client.Color.Red,
    adjacent: ["Beijing", "Seoul", "Tokyo", "Taipei", "Hong Kong"],
  },
  {
    name: "St Petersburg",
    location: [30.335099, 59.93428],
    color: Client.Color.Blue,
    adjacent: ["Moscow", "Essen", "Istanbul"],
  },
  {
    name: "Sydney",
    location: [151.209296, -33.86882],
    color: Client.Color.Red,
    adjacent: ["Los Angeles", "Manila", "Jakarta"],
  },
  {
    name: "Taipei",
    location: [135.565418, 23.032969], //[121.565418, 25.032969]
    color: Client.Color.Red,
    adjacent: ["Shanghai", "Osaka", "Manila", "Hong Kong"],
  },
  {
    name: "Tehran",
    location: [56.388974, 40.689198], //[51.388974, 35.689198]
    color: Client.Color.Black,
    adjacent: ["Moscow", "Delhi", "Karachi", "Baghdad"],
  },
  {
    name: "Tokyo",
    location: [139.691706, 45.689488], //[139.691706, 35.689488]
    color: Client.Color.Red,
    adjacent: ["Seoul", "Osaka", "San Francisco", "Shanghai"],
  },
  {
    name: "Washington",
    location: [-70.024902, 33.9072], //[-78.024902, 38.9072]
    color: Client.Color.Blue,
    adjacent: ["Montreal", "New York", "Miami", "Atlanta"],
  },
];
