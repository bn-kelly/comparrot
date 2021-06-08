import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../pages/authentication/services/auth.service';

@Component({
  selector: 'fury-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  isLoggedIn: boolean;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.user.subscribe(user => {
      this.isLoggedIn = !!user && !user.isAnonymous;
    });
  }
}
