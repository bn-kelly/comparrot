export class Vendor {
  name: string;
  searchUrl: string;
  selectors: {
    image: string | string[];
    price: string | string[];
    title: string | string[];
  };
  url: string;
}
