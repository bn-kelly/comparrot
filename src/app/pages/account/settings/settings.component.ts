import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
    selector: 'fury-account-settings-component',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
})
export class AccountSettingsComponent implements OnInit, OnDestroy {
    ngOnInit() {
        this.toggleExpandIframe(true);
    }

    ngOnDestroy() {
        this.toggleExpandIframe(false);
    }

    toggleExpandIframe(isOpen) {
        if (!window.chrome || !window.chrome.tabs) {
            return;
        }

        window.chrome.tabs.getSelected(null, tab => {
            window.chrome.tabs.sendMessage(tab.id, {
                action: 'toggle-expand-iframe-width',
                isOpen,
            });
        });
    }
}
