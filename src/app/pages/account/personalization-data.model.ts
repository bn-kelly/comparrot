export class PersonalizationData {
    personalizationTypes: {
        id: number;
        value: string;
    }[];
    personalizationCategories: {
        id: number;
        title: string;
        values: {
            id: number;
            value: string;
        }[];
    }[];
}
