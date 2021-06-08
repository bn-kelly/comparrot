export interface Offer {
  id: string;
  image?: string;
  imageUrl?: string;
  title: string;
  price: string;
  oldPrice?: string;
  isBestDeal?: boolean;
  buyUrl: string;
  vendor: string;
  created?: number;
}
