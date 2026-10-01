# SentinelACL Studio

## Script-Controlled Record Access Control Studio

SentinelACL Studio is a frontend-based access control policy design and simulation platform for evaluating record-level and field-level permissions.

The project demonstrates how users, roles, ACL rules, conditions, policy scripts, record permissions, field masking, audit trails, and policy exports can work together in an access control environment.

---

## Features

- Record-level access control
- Field-level access control
- Role-based access control
- User persona simulation
- Conditional ACL rules
- Script-controlled authorization
- ACL evaluation trace
- Security matrix
- Audit trail
- Field masking
- Record editor
- ACL inspector
- Policy export
- Multiple sample data domains
- Modern React + TypeScript interface

---

## Supported Demo Domains

The project includes sample records for:

- ITSM Incidents
- Customer Financials
- Clinical Patient Records
- HR Payroll

---

## Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- JavaScript / TypeScript
- Client-side ACL evaluation engine

---

## Architecture

```text
User
  |
  v
React Application
  |
  +-------------------+
  |                   |
  v                   v
Personas           ACL Rules
  |                   |
  +---------+---------+
            |
            v
       ACL Engine
            |
     +------+------+------+
     |      |      |      |
     v      v      v      v
   Roles Conditions Script Fields
            |
            v
      Access Decision
            |
      +-----+-----+
      |           |
     ALLOW       DENY
      |
      v
 Record / Field
      |
      v
 Audit Trail
