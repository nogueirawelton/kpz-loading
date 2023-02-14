export default class KpzLoader {
  static fslightboxConfig = {
    script:
      'https://cdnjs.cloudflare.com/ajax/libs/fslightbox/3.4.1/index.min.js',
  };

  static swiperConfig = {
    style: 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css',
    script: 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js',
  };

  constructor({ useLightbox = false, useSwiper = false }) {
    this.useLightbox = useLightbox;
    this.useSwiper = useSwiper;

    const { fslightboxConfig, swiperConfig } = KpzLoader;

    if (useLightbox) {
      this.fslightboxPromise = import(fslightboxConfig.script)
        .then(() => console.log('FsLightbox Loaded'))
        .catch((err) => console.log(`FsLightbox Load Error: ${err}`));
    }

    if (useSwiper) {
      this.swiperPromise = import(swiperConfig.script)
        .then(() => {
          const swiperCssLink = `<link rel="stylesheet" href="${swiperConfig.style}" />`;
          document.head.innerHTML += swiperCssLink;
          console.log('Swiper Loaded');
        })
        .catch((err) => console.log(`Swiper Load Error: ${err}`));
    }
  }

  lazy() {
    const entries = document.querySelectorAll('[data-kpzsrc]');

    function observerCallback(entries, observer) {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.src = target.dataset.kpzsrc;
          observer.unobserve(target);
        }
      });
    }

    const observer = new IntersectionObserver(observerCallback);

    entries.forEach((entry) => {
      observer.observe(entry);
    });
  }

  createLightbox(references) {
    if (!this.useLightbox) {
      throw new Error('Lightbox not enabled');
    }

    if (!references) {
      throw new Error('References can not be null');
    }

    const createStructure = (id) => {
      const reference = document.getElementById(id);
      const imgs = reference.querySelectorAll('img');

      const structure = Array.from(imgs).reduce((acc, img) => {
        return (
          acc +
          `
          <a href=${img.dataset.kpzsrc}" data-fslightbox="${id}">
            ${img.outerHTML}  
          </a>
        `
        );
      }, '');

      reference.innerHTML = structure;
    };

    if (Array.isArray(references)) {
      references.forEach((reference) => {
        createStructure(reference);
        this.fslightboxPromise.then(() => refreshFsLightbox());
      });
    }
  }

  createSwiper(references) {
    if (!this.useSwiper) {
      throw new Error('Swiper not enabled');
    }

    if (!references) {
      throw new Error('References can not be null');
    }

    const createStructure = ({ id, lightbox = false, config = {} }) => {
      const reference = document.getElementById(id);
      const wrappers = reference.querySelectorAll('.slide-wrapper');
      let structure = '';

      if (lightbox) {
        structure = Array.from(wrappers).reduce((acc, slide) => {
          const img = slide.querySelector('img');

          return (
            acc +
            `
          <a href="${img.dataset.kpzsrc}" data-fslightbox="${id}" class="swiper-slide ${id}-slide">
            ${slide.outerHTML}  
          </a>
        `
          );
        }, '');
      } else {
        structure = Array.from(reference.children).reduce((acc, slide) => {
          return (
            acc +
            `
            <div class="swiper-slide ${id}-slide">
              ${slide.outerHTML}  
            </div>
          `
          );
        }, '');
      }

      const swiperStructure = `
        <div class="swiper swiper-${id}">
          <div class="swiper-wrapper">
            ${structure}
          </div>
        </div>
      `;

      reference.innerHTML = swiperStructure;

      this.swiperPromise.then(() => {
        const swiper = new Swiper(`.swiper-${id}`, {
          ...config,
        });

        swiper.on('slideChange', () => {
          if (swiper.isEnd) {
            swiper.slideTo(0);
          }
        });

        if (lightbox) {
          refreshFsLightbox();
        }
      });
    };

    if (Array.isArray(references)) {
      references.forEach((reference) => {
        createStructure(reference);
      });
    }
  }
}
