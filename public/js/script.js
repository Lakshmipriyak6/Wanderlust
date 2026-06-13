(() => {
  'use strict'

  const getSavedTheme = () => {
    try {
      return localStorage.getItem('wanderlust-theme') || 'light'
    } catch (err) {
      return 'light'
    }
  }
  const themeButtons = document.querySelectorAll('[data-theme-value]')

  const applyTheme = theme => {
    const nextTheme = theme === 'dark' ? 'dark' : 'light'
    document.documentElement.dataset.theme = nextTheme
    try {
      localStorage.setItem('wanderlust-theme', nextTheme)
    } catch (err) {}

    themeButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.themeValue === nextTheme)
      button.setAttribute('aria-pressed', button.dataset.themeValue === nextTheme)
    })

    window.dispatchEvent(new CustomEvent('wanderlust:themechange', {
      detail: { theme: nextTheme }
    }))
  }

  applyTheme(getSavedTheme())

  themeButtons.forEach(button => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeValue))
  })

  const listingLinks = document.querySelectorAll('.listing-link')
  const searchInput = document.querySelector('.nav-search input')
  const filterButtons = document.querySelectorAll('[data-filter]')
  const taxSwitch = document.querySelector('#taxSwitch')
  let activeFilter = 'all'

  const categoryWords = {
    all: [],
    mountain: ['mountain', 'mountains', 'hill', 'hills', 'aspen', 'banff', 'verbier', 'highlands'],
    beach: ['beach', 'ocean', 'sea', 'malibu', 'cancun', 'fiji', 'bali', 'phuket', 'maldives', 'mykonos', 'miami'],
    city: ['city', 'new york', 'los angeles', 'tokyo', 'dubai', 'boston', 'charleston', 'amsterdam', 'florence', 'portland'],
    lake: ['lake', 'lakefront', 'tahoe']
  }

  const matchesFilter = listing => {
    if (activeFilter === 'all') return true
    const text = listing.dataset.search || ''
    return categoryWords[activeFilter].some(word => text.includes(word))
  }

  const updateListings = () => {
    const query = (searchInput?.value || '').trim().toLowerCase()

    listingLinks.forEach(listing => {
      const text = listing.dataset.search || ''
      const isVisible = text.includes(query) && matchesFilter(listing)
      listing.classList.toggle('d-none', !isVisible)
    })
  }

  searchInput?.addEventListener('input', updateListings)
  searchInput?.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return

    const query = searchInput.value.trim()
    if (!listingLinks.length) {
      window.location.href = `/listings${query ? `?q=${encodeURIComponent(query)}` : ''}`
    }
  })

  const initialQuery = new URLSearchParams(window.location.search).get('q')
  if (initialQuery && searchInput) {
    searchInput.value = initialQuery
    updateListings()
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter || 'all'
      filterButtons.forEach(filterButton => {
        filterButton.classList.toggle('active', filterButton === button)
      })
      updateListings()
    })
  })

  const formatPrice = price => new Intl.NumberFormat('en-IN').format(price)

  taxSwitch?.addEventListener('change', () => {
    const showTax = taxSwitch.checked

    document.querySelectorAll('.listing-price').forEach(priceElement => {
      const basePrice = Number(priceElement.dataset.price)
      if (!Number.isFinite(basePrice)) return

      const displayPrice = showTax ? Math.round(basePrice * 1.18) : basePrice
      priceElement.textContent = `₹ ${formatPrice(displayPrice)} / night${showTax ? ' with taxes' : ''}`
    })
  })

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()
