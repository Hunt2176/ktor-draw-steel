import { computed, Directive } from '@angular/core';

@Directive({
  selector: '[base]',
})
export class BaseDirective {
  readonly baseId = computed(() => {
    return BaseDirective.lastBaseId++;
  });
  
  private static lastBaseId = 0;
}
