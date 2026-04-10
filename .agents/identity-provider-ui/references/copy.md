# Copy/Language Quick Reference

## Page titles

| Context               | Title                      |
| --------------------- | -------------------------- |
| Provider list page    | Identity Providers         |
| Provider registration | Register Identity Provider |
| Provider detail/edit  | Provider Configuration     |
| Claim mapping editor  | Claim Mapping              |
| Issuer management     | Trusted Issuers            |

## Section headers

| Context               | Header                  |
| --------------------- | ----------------------- |
| Settings area         | Identity Configuration  |
| Provider list section | Connected Providers     |
| Provisioning section  | Provisioning & Sync     |
| Security section      | Authentication & Access |

## Button labels

| Action           | Label             |
| ---------------- | ----------------- |
| Add new provider | Register Provider |
| Edit existing    | Configure         |
| Delete provider  | Remove Provider   |
| Test connection  | Test Connection   |
| Enable provider  | Activate          |
| Disable provider | Disable           |
| Save mapping     | Save Mapping      |
| Save changes     | Save Changes      |

## Empty states

| Context           | Heading                     | Subtext                                                                       |
| ----------------- | --------------------------- | ----------------------------------------------------------------------------- |
| No providers      | No Identity Providers       | Register an OIDC provider to enable authentication for your organization.     |
| No claim mappings | No Claim Mappings           | Configure how identity provider claims map to internal roles and permissions. |
| No provisioning   | Provisioning Not Configured | Set up SCIM provisioning to automatically sync users and groups.              |

## Error messages

| Context                | Message                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| Invalid issuer URL     | Unable to reach the OIDC discovery document at this URL.                  |
| JWKS fetch failed      | Could not retrieve signing keys from the identity provider.               |
| Duplicate issuer       | This issuer URL is already registered for this tenant.                    |
| Connection test failed | Connection test failed. Verify the issuer URL and audience configuration. |
| Claim path invalid     | The claim path "{path}" was not found in the sample token.                |

## Status labels

| Status   | Label            | Context                                         |
| -------- | ---------------- | ----------------------------------------------- |
| active   | Active           | Provider is accepting tokens                    |
| disabled | Disabled         | Provider is registered but not accepting tokens |
| pending  | Pending          | Provider is registered, awaiting activation     |
| error    | Connection Error | Last health check failed                        |
