# Task Completion Checklist

## Before Completing Any Task
1. **Code Quality**
   - Run `npm run lint` to check for lint errors
   - Fix any TypeScript errors
   - Ensure consistent code formatting

2. **Testing** 
   - Test functionality manually in browser
   - Check both desktop and mobile views
   - Verify dark/light theme compatibility
   - Test different user roles if applicable

3. **Integration**
   - Ensure new components integrate with existing codebase
   - Check that database changes are reflected in Prisma schema
   - Verify API endpoints work correctly
   - Test auth flows and permissions

4. **Build Verification**
   - Run `npm run build` to ensure production build works
   - Fix any build errors or warnings
   - Verify no console errors in browser

## Database Changes
- Always run `npx prisma db push` after schema changes
- Consider creating migrations for production: `npx prisma migrate dev`
- Test database operations with Prisma Studio: `npx prisma studio`

## Security Considerations
- Validate all user inputs
- Check authentication and authorization
- Sanitize data before database operations
- Test for common vulnerabilities (XSS, injection)

## Performance
- Optimize images and assets
- Check for unnecessary re-renders
- Verify lazy loading works
- Monitor bundle size impact