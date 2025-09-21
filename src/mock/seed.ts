import { v4 as uuid } from 'uuid';
import type { User, Task, Service } from '../models/types';

export const helpers: User[] = Array.from({ length: 30 }).map((_, i) => ({
  id: uuid(),
  name: `Helper ${i + 1}`,
  photoUrl: undefined,
  skills: i % 3 === 0 ? ['moving','chores'] : i % 3 === 1 ? ['tutoring','gardening'] : ['chores'],
  rating: Math.round((3.7 + Math.random() * 1.3) * 10) / 10,
  jobsDone: Math.floor(Math.random() * 80),
  lat: 48.1482 + (Math.random() - 0.5) * 0.05,
  lng: 17.1067 + (Math.random() - 0.5) * 0.05,
}));

// Pretty cover photos (Unsplash). You can swap these anytime.
const imgs = {
  mowing: 'https://images.unsplash.com/photo-1523345863768-17bfa9f3d814?q=80&w=1400&auto=format&fit=crop',
  cleaning: 'https://images.unsplash.com/photo-1581574209460-7bdd93839a0b?q=80&w=1400&auto=format&fit=crop',
  tutoring: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1400&auto=format&fit=crop',
  moving: 'https://images.unsplash.com/photo-1516383607781-913a19294fd1?q=80&w=1400&auto=format&fit=crop',
  plumbing: 'https://images.unsplash.com/photo-1581579188871-c6b9b9c49b08?q=80&w=1400&auto=format&fit=crop',
  gardening: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1400&auto=format&fit=crop',
};

export const services: Service[] = [
  {
    id: uuid(),
    providerId: helpers[0].id,
    title: 'Lawn mowing & edging',
    categories: ['gardening','chores'],
    photoUrl: imgs.mowing,
    priceFrom: 15,
    lat: helpers[0].lat,
    lng: helpers[0].lng,
    rating: helpers[0].rating,
    jobsDone: helpers[0].jobsDone,
  },
  {
    id: uuid(),
    providerId: helpers[1].id,
    title: 'Deep apartment cleaning',
    categories: ['chores'],
    photoUrl: imgs.cleaning,
    priceFrom: 25,
    lat: helpers[1].lat,
    lng: helpers[1].lng,
    rating: helpers[1].rating,
    jobsDone: helpers[1].jobsDone,
  },
  {
    id: uuid(),
    providerId: helpers[2].id,
    title: 'Math tutoring (HS/Uni)',
    categories: ['tutoring'],
    photoUrl: imgs.tutoring,
    priceFrom: 18,
    lat: helpers[2].lat,
    lng: helpers[2].lng,
    rating: helpers[2].rating,
    jobsDone: helpers[2].jobsDone,
  },
  {
    id: uuid(),
    providerId: helpers[3].id,
    title: 'Two-people moving help',
    categories: ['moving'],
    photoUrl: imgs.moving,
    priceFrom: 30,
    lat: helpers[3].lat,
    lng: helpers[3].lng,
    rating: helpers[3].rating,
    jobsDone: helpers[3].jobsDone,
  },
  {
    id: uuid(),
    providerId: helpers[4].id,
    title: 'Quick plumbing fixes',
    categories: ['plumbing','maintenance'],
    photoUrl: imgs.plumbing,
    priceFrom: 25,
    lat: helpers[4].lat,
    lng: helpers[4].lng,
    rating: helpers[4].rating,
    jobsDone: helpers[4].jobsDone,
  },
  {
    id: uuid(),
    providerId: helpers[5].id,
    title: 'Garden care & trimming',
    categories: ['gardening'],
    photoUrl: imgs.gardening,
    priceFrom: 20,
    lat: helpers[5].lat,
    lng: helpers[5].lng,
    rating: helpers[5].rating,
    jobsDone: helpers[5].jobsDone,
  },
];

// Keep tasks (used elsewhere) – 1 demo task
export const tasks: Task[] = [
  {
    id: uuid(),
    title: 'Help me move a desk',
    description: 'From 3rd floor, today at 18:00.',
    category: 'moving',
    budget: 40,
    photos: [],
    status: 'open',
    requesterId: 'me',
    lat: 48.1482,
    lng: 17.1067,
    when: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];
