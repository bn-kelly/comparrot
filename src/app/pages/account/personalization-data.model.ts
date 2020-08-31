export class PersonalizationData {
  data: {
    id: number;
    order: number;
    title: string;
    categories: {
      id: number;
      order: number;
      title: string;
      sizes: {
        id: number;
        order: number;
        title: string;
        values: {
          id: number;
          order: number;
          title: string;
        }[];
      }[];
    }[];
  }[];
}
