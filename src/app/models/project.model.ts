import { CategoryOfInterest } from './category-of-interest.model';
import { EmailAlert } from './email-alert.model';
import { PersonalizationData } from './personalization-data.model';

export interface Project {
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
  categoriesOfInterest: CategoryOfInterest[];
  emailAlerts: EmailAlert[];
  personalizationData: PersonalizationData;
}
