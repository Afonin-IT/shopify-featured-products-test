if (!customElements.get('alternative-card-product')) {
  customElements.define('alternative-card-product', class AlternativeCardProduct extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.image = this.querySelector('.alternative-card-product__image img');
      this.variantsSelector = this.querySelector('.alternative-card-product__variants-selector select');
      this.variantIdInput = this.querySelector('input[name="id"]');
      this.discountWrapper = this.querySelector('.alternative-card-product__discount');
      this.priceWrapper = this.querySelector('.alternative-card-product__price');
      this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      this.submitButton = this.querySelector('[type="submit"]');
      if(this.variantsSelector) {
        this.variantsSelector.addEventListener('change', (e) => this.onVariantChange(e))
      }
      if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
      this.updateMasterId = this.updateMasterId.bind(this)
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

      this.submitButton.setAttribute('aria-disabled', true);
      this.submitButton.classList.add('loading');
      this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      const formData = new FormData(this.form);
      if (this.cart) {
        formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
        formData.append('sections_url', window.location.pathname);
        this.cart.setActiveElement(document.activeElement);
      }
      config.body = formData;

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
            if (!soldOutMessage) return;
            this.submitButton.setAttribute('aria-disabled', true);
            this.submitButton.querySelector('span').classList.add('hidden');
            soldOutMessage.classList.remove('hidden');
            this.error = true;
            return;
          }

          this.error = false;
          this.cart.renderContents(response);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.submitButton.classList.remove('loading');
          if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
          if (!this.error) this.submitButton.removeAttribute('aria-disabled');
          this.querySelector('.loading-overlay__spinner').classList.add('hidden');
        });
    }

    onVariantChange(e) {
      const value = e.target.value;
      this.updateMasterId(value);
      this.updateVariantInput();
      this.updateMedia();
      this.updateDiscount();
      this.updatePrice();
    }

    updateMasterId(id) {
      this.currentVariant = this.getVariantData().find((variant) => {
        return variant.id === Number(id)
      });
    }

    updateVariantInput() {
      this.variantIdInput.value = this.currentVariant.id;
    }

    updatePrice() {
      const price = (this.currentVariant.price / 100).toFixed(2);
      this.priceWrapper.textContent = price;
    }

    updateDiscount() {
      if(this.currentVariant.compare_at_price && this.currentVariant.compare_at_price > this.currentVariant.price) {
        this.discountWrapper.style.display = 'inline-flex';
        const discount = Math.floor(Math.abs((this.currentVariant.price / this.currentVariant.compare_at_price - 1) * 100));
        this.discountWrapper.querySelector('span').textContent = discount;
      } else {
        this.discountWrapper.style.display = 'none';
      }
    }

    updateMedia() {
      if (!this.currentVariant) return;
      if (!this.currentVariant.featured_image) return;

      this.image.setAttribute('src', this.currentVariant.featured_image.src)
    }

    getVariantData() {
      this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
      return this.variantData;
    }
  })
}