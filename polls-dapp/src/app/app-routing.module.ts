import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PollsComponent } from './polls/polls.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PollComponent } from './poll/poll.component';
import { CreatePollComponent } from './create-poll/create-poll.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'polls', component: PollsComponent },
  { path: 'create-poll', component: CreatePollComponent },
  { path: 'poll', component: PollComponent },
  { path: 'poll/:id', component: PollComponent },
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '/404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
