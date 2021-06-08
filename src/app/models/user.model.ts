export interface User {
  displayName?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  photoURL?: string;
  ui: {
    navigation: 'side' | 'top';
    sidenavUserVisible: boolean;
    toolbarVisible: boolean;
    toolbarPosition: any;
    footerVisible: boolean;
    footerPosition: any;
    theme: 'fury-default' | 'fury-light' | 'fury-dark' | 'fury-flat';
    title: string;
    search: string;
  };
  extension?: {
    show: boolean;
    lastShown: number;
  };
  projectName?: string;
  uid: string;
  isAnonymous: boolean;
  isAdmin?: boolean;
  isBot?: boolean;
  emailAlerts?: any;
  categoriesOfInterest?: any;
  wishList?: string[];
  personalizationData?: any;
  categoriesDescriptions?: any;
  filters?: {
    offersDefaultSelected?: number;
  };
}
