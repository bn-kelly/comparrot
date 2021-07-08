import {
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { fadeInUpAnimation } from '../../../../@fury/animations/fade-in-up.animation';
import { OAuthComponent } from 'src/app/layout/oauth/oauth.component';

@Component({
  selector: 'fury-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [fadeInUpAnimation],
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent extends OAuthComponent implements OnInit {

  ngOnInit() {
  }
}
