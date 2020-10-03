import { CategoryOfInterest } from '../pages/account/category-of-interest.model';
import { EmailAlert } from '../pages/account/email-alert.model';
import { PersonalizationData } from '../pages/account/personalization-data.model';

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
  categoriesOfInterest: CategoryOfInterest[];
  emailAlerts: EmailAlert[];
  personalizationData: PersonalizationData;
}
