import {Suspense, useState, useEffect, useRef} from 'react';
import {Await, NavLink, useAsyncValue, useLocation} from '@remix-run/react';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
import {motion, useScroll} from 'framer-motion';
import Frame_89 from '../assets/Frame_89.png';
import Hours from './Hours';
/**
 * @param {HeaderProps}
 */
export function Header({header, isLoggedIn, cart, publicStoreDomain, hours}) {
  const {shop, menu} = header;

  return (
    <header className="header">
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
        cart={cart}
      />
      {/* <MobileFooter hours={hours} /> */}
    </header>
  );
}

/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */
export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
  cart,
}) {
  const className = `header-menu`;
  const {close} = useAside();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 499px)');

    // Update state initially and on changes
    const updateIsMobile = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', updateIsMobile);
    setIsMobile(mediaQuery.matches);

    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  function moveArrayElement(arr, fromIndex, toIndex) {
    const newArr = [...arr]; // Create a shallow copy of the array
    const [element] = newArr.splice(fromIndex, 1); // Remove the element
    newArr.splice(toIndex, 0, element); // Insert the element at the new position
    return newArr; // Return the new array
  }

  const info = menu.items.find((i) => i.title === 'Info');
  const indexOfInfo = menu.items.indexOf(info);

  const [dynamicMenu, setDynamicMenu] = useState(
    (menu || FALLBACK_HEADER_MENU).items,
  );

  useEffect(() => {
    const originalMenu = (menu || FALLBACK_HEADER_MENU).items;
    if (isMobile) {
      const newOrder = moveArrayElement(originalMenu, indexOfInfo, 3);
      const shop = newOrder.find((i) => i.title === 'Shop');
      const indexOfShop = newOrder.indexOf(shop);
      setDynamicMenu(moveArrayElement(newOrder, indexOfShop, 4));
    } else {
      setDynamicMenu(originalMenu); // Reset to the original order
    }
  }, [isMobile, menu, indexOfInfo]);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0); // Check if the user has scrolled down
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const ref = useRef(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (ref.current) {
        document.documentElement.style.setProperty(
          '--header-height',
          `calc(${ref.current.offsetHeight}px + 1rem)`,
        );
        document.documentElement.style.setProperty(
          '--mobile-header-height',
          `calc(${ref.current.offsetHeight}px + 1rem)`,
        );
      }
    };

    // Initialize and listen to size changes
    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    // Cleanup observer on unmount
    return () => {
      if (ref.current) {
        resizeObserver.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <nav
      className={className}
      role="navigation"
      style={{
        background: scrolled
          ? 'linear-gradient(to bottom, var(--color-creme),transparent)'
          : 'transparent',
      }}
      ref={ref}
    >
      {dynamicMenu.map((item) => {
        if (!item.url) return null;

        // If the URL is internal, strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        return (
          <HeaderMenuItem
            key={item.id}
            title={item.title}
            cart={cart}
            close={close}
            url={url}
          />
        );
      })}
    </nav>
  );
}

function HeaderMenuItem({title, cart, close, url}) {
  const [showDot, setShowDot] = useState(false);
  const {pathname} = useLocation();

  useEffect(() => {
    setShowDot(pathname === url);
  }, [pathname, url]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 816px)');

    // Update state initially and on changes
    const updateIsMobile = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', updateIsMobile);
    setIsMobile(mediaQuery.matches);

    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  return (
    <motion.div
      layout
      className="header-menu-item-container"
      onMouseEnter={() => setShowDot(true)}
      onMouseLeave={() => {
        if (pathname !== url) setShowDot(false);
      }}
      transition={{layout: {duration: 0.3}, ease: 'easeInOut'}}
      initial={{
        boxShadow: 'none',
        outline: 'none',
      }}
      animate={
        pathname === url
          ? {
              boxShadow: 'none',
              outline: 'none',
            }
          : {
              boxShadow: 'none',
              outline: 'none',
            }
      }
    >
      <NavLink
        className="header-menu-item"
        end
        onClick={close}
        prefetch="intent"
        to={url}
      >
        <motion.div
          className="dot"
          initial={{opacity: 0}}
          animate={{opacity: showDot ? 1 : 0}}
          transition={{duration: 0.3, ease: 'easeInOut'}}
          style={{position: 'absolute'}}
        >
          ●
        </motion.div>

        <motion.span
          layout
          transition={{duration: 0.3, ease: 'easeInOut'}}
          initial={{marginLeft: 0}}
          animate={{
            marginLeft: showDot ? '.75em' : 0,
          }}
        >
          {title === 'Cart' ? <CartToggle cart={cart} /> : title}
        </motion.span>
      </NavLink>
    </motion.div>
  );
}

/**
 * @param {Pick<HeaderProps, 'isLoggedIn' | 'cart'>}
 */
function HeaderCtas({isLoggedIn, cart}) {
  return (
    <nav className="header-ctas" role="navigation">
      <HeaderMenuMobileToggle />
      <NavLink prefetch="intent" to="/account" style={activeLinkStyle}>
        <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign in')}
          </Await>
        </Suspense>
      </NavLink>
      <SearchToggle />
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-menu-mobile-toggle reset"
      onClick={() => open('mobile')}
    >
      <h3>☰</h3>
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button className="reset" onClick={() => open('search')}>
      Search
    </button>
  );
}

/**
 * @param {{count: number | null}}
 */
function CartBadge({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <span
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
    >
      Cart {count === null ? <span>&nbsp;</span> : `(${count})`}
    </span>
  );
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

/**
 * @param {{
 *   isActive: boolean;
 *   isPending: boolean;
 * }}
 */
function activeLinkStyle({isActive, isPending}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'black',
  };
}

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */

function MobileFooter({hours}) {
  const {scrollYProgress} = useScroll();
  const [isFooterActive, setIsFooterActive] = useState(false);
  const [footerY, setFooterY] = useState(130); // Start at 100% off-screen

  useEffect(() => {
    if (!isFooterActive)
      document.querySelector('.header').style.pointerEvents = 'none';
    else document.querySelector('.header').style.pointerEvents = 'auto';

    const handleScroll = (e) => {
      if (isFooterActive) {
        e.preventDefault();
        setFooterY((prev) => {
          const newFooterY = Math.max(0, prev - e.deltaY * 0.2); // Prevent negative values
          if (newFooterY > 130) {
            if (document.body.offsetHeight !== window.innerHeight)
              setIsFooterActive(false); // Deactivate footer if it exceeds 130
            return 130; // Reset to 130
          }
          return newFooterY;
        });
      }
    };

    const handleTouchMove = (e) => {
      if (isFooterActive) {
        const touch = e.touches[0];
        setFooterY((prev) => {
          const newFooterY = Math.max(0, prev - touch.clientY * 0.05); // Prevent negative values
          if (newFooterY > 130) {
            if (document.body.offsetHeight !== window.innerHeight)
              setIsFooterActive(false); // Deactivate footer if it exceeds 130
            return 130; // Reset to 130
          }
          return newFooterY;
        });
      }
    };

    if (isFooterActive) {
      window.addEventListener('wheel', handleScroll, {passive: false});
      window.addEventListener('touchmove', handleTouchMove, {passive: false});
    } else {
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchmove', handleTouchMove);
    }

    return () => {
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isFooterActive]);

  useEffect(() => {
    if (scrollYProgress.current === 1) setIsFooterActive(true); // Activate manual scrolling;
    const unsubscribe = scrollYProgress.onChange((value) => {
      if (value === 1) {
        setIsFooterActive(true); // Activate manual scrolling
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <motion.div
      className="mobile-footer"
      style={{
        transform: `translateY(${footerY}%)`,
      }}
      transition={{type: 'tween', duration: 0.5}}
    >
      <img src={Frame_89} alt="Apollo Bagels in script" />
      <Hours hours={hours} mobile={true} />
      <div className="mobile-footer-bottom">
        <div className="mobile-footer-links">
          <a
            href="https://www.instagram.com/apollobagels/"
            target="_blank"
            rel="noopener noreferrer"
          >
            ig. @apollobagels
          </a>
          <a href="mailto:hello@apollobagels.com">e. hello@apollobagels.com</a>
        </div>
        <a href="#">SUBSCRIBE</a>
        <p>© Apollo Bagels 2024, All Rights Reserved.</p>
      </div>
    </motion.div>
  );
}
