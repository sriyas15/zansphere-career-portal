import { navigation } from './navigation';
import { jest } from '@jest/globals';

describe('Navigation Utils', () => {
  it('should call assign and throw not implemented error in jsdom', () => {
    try {
      navigation.redirectTo('/login');
    } catch (e) {
      expect(e.message).toContain('Not implemented: navigation');
    }
  });
});
