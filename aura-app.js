(() => {
  const CART_KEY = "aura.cart";
  const FAVORITES_KEY = "aura.favorites";
  const SUBSCRIBERS_KEY = "aura.subscribers";
  const ORDER_KEY = "aura.latestOrder";
  const DISCOUNTS = { AURA10: 0.1, GLOW15: 0.15, WELCOME: 0.08 };

  const defaultCheckoutItems = [
    { name: "\u5de5\u85dd\u7f8a\u6bdb\u5927\u8863", subtitle: "\u5c3a\u5bf8\uff1aM | \u984f\u8272\uff1aSandstone", price: 340, image: "images/Untitled design.png" },
    { name: "UN-TAG \u7d72\u5dfe", subtitle: "\u55ae\u4e00\u5c3a\u5bf8 | \u984f\u8272\uff1aAmber Mist", price: 88, image: "images/Untitled design.png" },
  ];

  const formatCurrency = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  const read = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const toast = (message) => {
    let root = document.getElementById("aura-toast-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "aura-toast-root";
      root.className = "fixed right-4 top-24 z-[100] space-y-3";
      document.body.appendChild(root);
    }
    const item = document.createElement("div");
    item.className = "max-w-sm rounded-2xl border border-orange-100 bg-white/95 px-4 py-3 text-sm font-medium text-[#311300] shadow-xl";
    item.textContent = message;
    root.appendChild(item);
    setTimeout(() => item.remove(), 2200);
  };

  const syncBagCount = () => {
    const count = read(CART_KEY, []).length;
    document.querySelectorAll("[data-bag-count]").forEach((node) => {
      node.textContent = String(count);
      node.classList.toggle("hidden", count === 0);
    });
  };

  const addToCart = (item) => {
    const cart = read(CART_KEY, []);
    cart.push(item);
    write(CART_KEY, cart);
    syncBagCount();
  };

  const setupNewsletterForms = () => {
    document.querySelectorAll("[data-newsletter-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector("input[type='email']");
        const email = input?.value.trim() || "";
        if (!email.includes("@")) return toast("\u8acb\u8f38\u5165\u6709\u6548\u7684\u96fb\u5b50\u90f5\u4ef6\u5730\u5740\u3002");
        const subscribers = new Set(read(SUBSCRIBERS_KEY, []));
        subscribers.add(email);
        write(SUBSCRIBERS_KEY, [...subscribers]);
        form.reset();
        toast("\u4f60\u5df2\u52a0\u5165\u640d\u5148\u901a\u77e5\u540d\u55ae\u3002");
      });
    });
  };

  const setupSearchInputs = () => {
    document.querySelectorAll("[data-search-input]").forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const query = input.value.trim();
        if (!query) return toast("\u8acb\u8f38\u5165\u95dc\u9375\u5b57\u4ee5\u63a2\u7d22\u7cfb\u5217\u5546\u54c1\u3002");
        window.location.href = "\u5546\u54c1\u9801\u9762.html?q=" + encodeURIComponent(query);
      });
    });
  };

  const setupFavoriteButtons = () => {
    const favorites = new Set(read(FAVORITES_KEY, []));
    document.querySelectorAll("[data-favorite-button]").forEach((button) => {
      const name = button.dataset.productName || "UN-TAG";
      button.addEventListener("click", () => {
        if (favorites.has(name)) {
          favorites.delete(name);
          toast(name + " \u5df2\u5f9e\u6536\u85cf\u4e2d\u79fb\u9664\u3002");
        } else {
          favorites.add(name);
          toast(name + " \u5df2\u52a0\u5165\u6536\u85cf\u3002");
        }
        write(FAVORITES_KEY, [...favorites]);
      });
    });
  };

  const setupProductDetail = () => {
    const root = document.querySelector("[data-product-detail]");
    if (!root) return;
    const selected = { color: root.dataset.defaultColor || "Ink Black", size: root.dataset.defaultSize || "S" };

    document.querySelectorAll("[data-option-group]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.disabled === "true") return toast(button.dataset.optionValue + " \u76ee\u524d\u66ab\u6642\u7121\u6cd5\u9078\u8cfc\u3002");
        selected[button.dataset.optionGroup] = button.dataset.optionValue;
      });
    });

    document.querySelectorAll("[data-size-guide]").forEach((button) => {
      button.addEventListener("click", () => toast("\u5c3a\u5bf8\u6307\u5357\uff1aXS 32-34 / S 35-37 / M 38-40 / L 41-43"));
    });

    document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const name = button.dataset.productName || root.dataset.productName || "UN-TAG";
        addToCart({
          name,
          subtitle: "\u5c3a\u5bf8\uff1a" + selected.size + " | \u984f\u8272\uff1a" + selected.color,
          price: Number(button.dataset.price || root.dataset.price || 0),
          image: root.dataset.image || "images/Untitled design.png",
        });
        toast(name + " \u5df2\u52a0\u5165\u8cfc\u7269\u888b\u3002");
        window.location.href = button.getAttribute("href") || "\u7d50\u5e33\u756b\u9762.html";
      });
    });
  };

  const setupCatalog = () => {
    const grid = document.getElementById("product-grid");
    if (!grid) return;

    const cards = [...grid.querySelectorAll("[data-product-card]")];
    const state = { query: new URLSearchParams(window.location.search).get("q") || "", categories: new Set(["all"]), size: "", color: "", sort: new URLSearchParams(window.location.search).get("sort") || "newest" };
    const countNode = document.getElementById("catalog-count");
    const searchInput = document.querySelector("[data-search-input]");
    const sortSelect = document.getElementById("catalog-sort");
    const categoryInputs = [...document.querySelectorAll("[data-filter-category]")];

    if (searchInput) searchInput.value = state.query;
    if (sortSelect) sortSelect.value = state.sort;

    const render = () => {
      let visible = cards.filter((card) => {
        const query = state.query.toLowerCase();
        const matchesQuery = !query || (card.textContent || "").toLowerCase().includes(query);
        const matchesCategory = state.categories.has("all") || state.categories.has(card.dataset.category);
        const matchesSize = !state.size || (card.dataset.sizes || "").split(",").includes(state.size);
        const matchesColor = !state.color || (card.dataset.colors || "").split(",").includes(state.color);
        return matchesQuery && matchesCategory && matchesSize && matchesColor;
      });

      visible.sort((a, b) => {
        const aPrice = Number(a.dataset.price || 0);
        const bPrice = Number(b.dataset.price || 0);
        const aRank = Number(a.dataset.rank || 0);
        const bRank = Number(b.dataset.rank || 0);
        if (state.sort === "price-low") return aPrice - bPrice;
        if (state.sort === "price-high") return bPrice - aPrice;
        return aRank - bRank;
      });

      cards.forEach((card) => card.classList.add("hidden"));
      visible.forEach((card) => {
        card.classList.remove("hidden");
        grid.appendChild(card);
      });
      if (countNode) countNode.textContent = "\u986f\u793a " + visible.length + " / " + cards.length + " \u4ef6\u5546\u54c1";
    };

    searchInput?.addEventListener("input", () => { state.query = searchInput.value.trim(); render(); });
    sortSelect?.addEventListener("change", () => { state.sort = sortSelect.value; render(); });

    categoryInputs.forEach((input) => {
      input.addEventListener("change", () => {
        const value = input.dataset.filterCategory;
        if (value === "all" && input.checked) {
          state.categories = new Set(["all"]);
          categoryInputs.forEach((item) => { item.checked = item === input; });
        } else {
          state.categories.delete("all");
          categoryInputs.find((item) => item.dataset.filterCategory === "all").checked = false;
          if (input.checked) state.categories.add(value); else state.categories.delete(value);
          if (!state.categories.size) {
            state.categories = new Set(["all"]);
            categoryInputs.find((item) => item.dataset.filterCategory === "all").checked = true;
          }
        }
        render();
      });
    });

    document.querySelectorAll("[data-filter-size]").forEach((button) => {
      button.addEventListener("click", () => { state.size = state.size === button.dataset.filterSize ? "" : button.dataset.filterSize; render(); });
    });

    document.querySelectorAll("[data-filter-color]").forEach((button) => {
      button.addEventListener("click", () => { state.color = state.color === button.dataset.filterColor ? "" : button.dataset.filterColor; render(); });
    });

    document.querySelector("[data-clear-filters]")?.addEventListener("click", () => {
      state.categories = new Set(["all"]);
      state.size = "";
      state.color = "";
      state.query = "";
      state.sort = "newest";
      categoryInputs.forEach((item) => { item.checked = item.dataset.filterCategory === "all"; });
      if (searchInput) searchInput.value = "";
      if (sortSelect) sortSelect.value = "newest";
      render();
      toast("\u5df2\u6e05\u9664\u6240\u6709\u7be9\u9078\u689d\u4ef6\u3002");
    });

    document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const card = button.closest("[data-product-card]");
        addToCart({
          name: card.querySelector("h3")?.textContent?.trim() || "UN-TAG",
          subtitle: card.querySelector("p")?.textContent?.trim() || "",
          price: Number(card.dataset.price || 0),
          image: card.querySelector("img")?.getAttribute("src") || "images/Untitled design.png",
        });
        toast("\u5546\u54c1\u5df2\u52a0\u5165\u8cfc\u7269\u888b\u3002");
        window.location.href = button.getAttribute("href") || "\u7d50\u5e33\u756b\u9762.html";
      });
    });

    render();
  };

  const setupCheckout = () => {
    const root = document.getElementById("checkout-items");
    if (!root) return;
    let cart = read(CART_KEY, []);
    if (!cart.length) cart = defaultCheckoutItems;
    let discountRate = 0;
    let payment = "card";

    const subtotalNode = document.getElementById("summary-subtotal");
    const discountNode = document.getElementById("summary-discount");
    const taxNode = document.getElementById("summary-tax");
    const totalNode = document.getElementById("summary-total");
    const submitButton = document.getElementById("checkout-submit");

    const render = () => {
      root.innerHTML = "";
      cart.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "flex gap-4";
        row.innerHTML =
          '<div class="h-24 w-20 overflow-hidden rounded-lg bg-[#fff8f5]"><img class="h-full w-full object-cover" src="' + item.image + '" alt="' + item.name + '"/></div>' +
          '<div class="flex flex-1 items-start justify-between gap-4"><div><p class="font-bold">' + item.name + '</p><p class="text-xs text-[#564336]">' + item.subtitle + '</p><p class="mt-2 font-semibold text-[#964900]">' + formatCurrency(item.price) + '</p></div><button class="text-xs font-semibold text-[#964900]" data-remove-cart-item="' + index + '">\u79fb\u9664</button></div>';
        root.appendChild(row);
      });

      root.querySelectorAll("[data-remove-cart-item]").forEach((button) => {
        button.addEventListener("click", () => {
          cart.splice(Number(button.dataset.removeCartItem), 1);
          write(CART_KEY, cart);
          syncBagCount();
          render();
        });
      });

      const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
      const discount = subtotal * discountRate;
      const tax = Math.round((subtotal - discount) * 0.05 * 100) / 100;
      const total = subtotal - discount + tax;

      subtotalNode.textContent = formatCurrency(subtotal);
      discountNode.textContent = discount ? "-" + formatCurrency(discount) : formatCurrency(0);
      taxNode.textContent = formatCurrency(tax);
      totalNode.textContent = formatCurrency(total);
      submitButton.querySelector("[data-total-label]").textContent = formatCurrency(total);
    };

    document.querySelectorAll("[data-payment-method]").forEach((option) => {
      option.addEventListener("click", () => { payment = option.dataset.paymentMethod; });
    });

    document.getElementById("apply-discount")?.addEventListener("click", () => {
      const code = document.getElementById("discount-code").value.trim().toUpperCase();
      if (!code) return toast("\u8acb\u5148\u8f38\u5165\u6298\u6263\u78bc\u3002");
      if (!DISCOUNTS[code]) return toast("\u9019\u500b\u6298\u6263\u78bc\u76ee\u524d\u7121\u6cd5\u4f7f\u7528\u3002");
      discountRate = DISCOUNTS[code];
      render();
      toast(code + " \u5df2\u5957\u7528\u5230\u4f60\u7684\u8a02\u55ae\u3002");
    });

    submitButton?.addEventListener("click", () => {
      for (const [id, label] of [["first-name", "\u540d\u5b57"], ["last-name", "\u59d3\u6c0f"], ["street-address", "\u8857\u9053\u5730\u5740"], ["city", "\u57ce\u5e02"], ["postal-code", "\u90f5\u905e\u5340\u865f"]]) {
        const input = document.getElementById(id);
        if (!input?.value.trim()) return toast("\u8acb\u586b\u5beb\u300c" + label + "\u300d\u3002");
      }
      if (payment === "card") {
        for (const [id, label] of [["card-number", "\u5361\u865f"], ["card-expiry", "\u6709\u6548\u671f\u9650"], ["card-cvc", "\u5b89\u5168\u78bc CVC"]]) {
          const input = document.getElementById(id);
          if (!input?.value.trim()) return toast("\u4f7f\u7528\u4fe1\u7528\u5361\u4ed8\u6b3e\u6642\uff0c\u8acb\u586b\u5beb\u300c" + label + "\u300d\u3002");
        }
      }
      write(ORDER_KEY, { total: totalNode.textContent, payment, itemCount: cart.length, createdAt: new Date().toISOString() });
      write(CART_KEY, []);
      syncBagCount();
      window.location.href = "order-success.html";
    });

    render();
  };

  const setupAccountPage = () => {
    const favoritesRoot = document.getElementById("account-favorites");
    const bagRoot = document.getElementById("account-bag");
    if (favoritesRoot) {
      const favorites = read(FAVORITES_KEY, []);
      favoritesRoot.innerHTML = favorites.length
        ? favorites.map((name) => '<div class="rounded-2xl bg-[#fff8f5] px-5 py-4"><p class="font-bold">' + name + '</p><p class="mt-1 text-sm text-[#564336]">\u5df2\u70ba\u4f60\u4fdd\u7559\u5728\u4e0b\u6b21\u642d\u914d\u6e05\u55ae\u4e2d\u3002</p></div>').join("")
        : "<p class='text-sm text-[#564336]'>\u5c1a\u672a\u6536\u85cf\u4efb\u4f55\u5546\u54c1\u3002</p>";
    }
    if (bagRoot) {
      const bag = read(CART_KEY, []);
      bagRoot.innerHTML = bag.length
        ? bag.map((item) => '<div class="rounded-2xl bg-[#fff8f5] px-5 py-4"><p class="font-bold">' + item.name + '</p><p class="mt-1 text-sm text-[#564336]">' + item.subtitle + '</p><p class="mt-2 text-sm font-bold text-[#964900]">' + formatCurrency(item.price) + "</p></div>").join("")
        : "<p class='text-sm text-[#564336]'>\u4f60\u7684\u8cfc\u7269\u888b\u76ee\u524d\u662f\u7a7a\u7684\u3002</p>";
    }
  };

  const setupOrderSuccess = () => {
    const total = document.getElementById("order-total");
    const meta = document.getElementById("order-meta");
    if (!total || !meta) return;
    const order = read(ORDER_KEY, null);
    if (!order) return;
    total.textContent = order.total;
    meta.textContent = order.itemCount + " \u4ef6\u5546\u54c1 | " + order.payment.toUpperCase() + " \u4ed8\u6b3e";
  };

  document.addEventListener("DOMContentLoaded", () => {
    syncBagCount();
    setupNewsletterForms();
    setupSearchInputs();
    setupFavoriteButtons();
    setupProductDetail();
    setupCatalog();
    setupCheckout();
    setupAccountPage();
    setupOrderSuccess();
  });
})();
