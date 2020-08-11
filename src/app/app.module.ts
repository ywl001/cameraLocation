import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FileUploadModule } from 'ng2-file-upload';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { MarkerInfoComponent } from './marker-info/marker-info.component';

import { NgImageFullscreenViewModule } from 'ng-image-fullscreen-view';
import {
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatDialogModule,
  MatRadioModule,
  MatButtonModule,
  MatSidenavModule,
  MatListModule,
  MatCardModule
} from '@angular/material';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EditMarkComponent } from './edit-mark/edit-mark.component';
import { LoginComponent } from './login/login.component';
import { SearchComponent } from './search/search.component';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    MarkerInfoComponent,
    EditMarkComponent,
    LoginComponent,
    SearchComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FileUploadModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDialogModule,
    MatRadioModule,
    FormsModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    NgImageFullscreenViewModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [MarkerInfoComponent,EditMarkComponent,LoginComponent]
})
export class AppModule { }
