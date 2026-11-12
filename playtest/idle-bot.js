import { runEvents } from './bot.js';

export function idleBot(c) {
  return runEvents(c, []);
}
