export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    },
    header: {
      slots: {
        center:
          'hidden lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:justify-center lg:overflow-x-auto lg:px-1'
      }
    }
  }
})
