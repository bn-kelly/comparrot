export class Project {
  logoUrl: {
    default: string;
    light: string;
    dark: string;
    flat: string;
  };
  gtmCode?: string;
  favicon?: string;
  name: string;
  faq: [];
  links: {
    termsOfService: string;
    privacyPolicy: string;
  };
  contactUsEmails: string[];
}
