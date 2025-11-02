# CGT Timeline Test JSON Files

This folder contains 10 example JSON files that can be imported into the CGT Timeline application.

## How to Import

1. Click the **Upload** button (📤 icon) in the top toolbar
2. Select any of the JSON files from this folder
3. The timeline will automatically load with the imported data

## File Descriptions

### 01-simple-first-home.json
- **Scenario**: First-time home buyer with a single property
- **Properties**: 1
- **Events**: 3
- **Complexity**: ⭐ Simple
- **Use Case**: Testing basic PPR (Principal Place of Residence) functionality

### 02-property-investor.json
- **Scenario**: Investment portfolio with multiple rental properties
- **Properties**: 4
- **Events**: 9
- **Complexity**: ⭐⭐ Medium
- **Use Case**: Testing rental property tracking and portfolio management

### 03-property-upgrader.json
- **Scenario**: Progressive home upgrades over time
- **Properties**: 3
- **Events**: 14
- **Complexity**: ⭐⭐⭐ Medium-High
- **Use Case**: Testing PPR transitions, sales, and property improvements

### 04-property-flipper.json
- **Scenario**: Property flipper buying, renovating, and selling
- **Properties**: 5
- **Events**: 15
- **Complexity**: ⭐⭐⭐ Medium-High
- **Use Case**: Testing rapid buy-improve-sell cycles

### 05-long-term-holder.json
- **Scenario**: Long-term property holder since 2000
- **Properties**: 1
- **Events**: 14
- **Complexity**: ⭐⭐ Medium
- **Use Case**: Testing extensive improvement history and refinancing

### 06-large-portfolio.json
- **Scenario**: Serious investor with properties across Australia
- **Properties**: 10 🎯
- **Events**: 22
- **Complexity**: ⭐⭐⭐⭐ High
- **Use Case**: Testing large portfolio handling and visualization

### 07-recent-buyer.json
- **Scenario**: Recent first-time buyer (2024)
- **Properties**: 1
- **Events**: 2
- **Complexity**: ⭐ Very Simple
- **Use Case**: Testing minimal data and recent purchases

### 08-property-developer.json
- **Scenario**: Developer building properties from land
- **Properties**: 3
- **Events**: 15
- **Complexity**: ⭐⭐⭐ Medium-High
- **Use Case**: Testing construction status and land/building price breakdown

### 09-complex-mixed-portfolio.json
- **Scenario**: Complex mix of PPR, rentals, and improvements
- **Properties**: 5
- **Events**: 25 🎯
- **Complexity**: ⭐⭐⭐⭐⭐ Very High
- **Use Case**: Testing all event types and complex scenarios

### 10-downsizer.json
- **Scenario**: Retiree downsizing from family home
- **Properties**: 3
- **Events**: 15
- **Complexity**: ⭐⭐⭐ Medium-High
- **Use Case**: Testing long-term ownership and downsizing scenarios

## Supported JSON Formats

The import function supports two JSON formats:

### Format 1: Direct Properties and Events Arrays

```json
{
  "name": "Portfolio Name",
  "description": "Description of the scenario",
  "properties": [
    {
      "id": "prop-1",
      "name": "Property Name",
      "address": "123 Street, City, State",
      "color": "#3B82F6",
      "purchasePrice": 500000,
      "purchaseDate": "2020-01-01T00:00:00.000Z",
      "currentValue": 600000,
      "currentStatus": "ppr",
      "branch": 0
    }
  ],
  "events": [
    {
      "id": "event-1",
      "propertyId": "prop-1",
      "type": "purchase",
      "date": "2020-01-01T00:00:00.000Z",
      "title": "Purchase",
      "amount": 500000,
      "color": "#3B82F6",
      "isPPR": true
    }
  ]
}
```

### Format 2: Export Format (Property History)

```json
{
  "properties": [
    {
      "address": "Property Name, 123 Street, City",
      "property_history": [
        {
          "date": "2020-01-01",
          "event": "purchase",
          "price": 500000,
          "is_ppr": true
        },
        {
          "date": "2022-06-15",
          "event": "improvement",
          "price": 35000,
          "description": "Kitchen renovation"
        }
      ],
      "notes": "Additional notes"
    }
  ]
}
```

## Event Types

The following event types are supported:

- `purchase` - Property purchase
- `sale` - Property sale
- `move_in` - Moving into property (PPR)
- `move_out` - Moving out of property
- `rent_start` - Starting to rent out property
- `rent_end` - Ending rental period
- `improvement` - Property improvements/renovations
- `refinance` - Mortgage refinancing
- `status_change` - Change in property status

## Property Status Types

- `ppr` - Principal Place of Residence
- `rental` - Rental/Investment property
- `vacant` - Vacant property
- `construction` - Under construction
- `sold` - Sold property

## Testing Tips

1. **Start Simple**: Try importing `01-simple-first-home.json` first
2. **Test Scale**: Use `06-large-portfolio.json` to test 10 properties
3. **Test Complexity**: Use `09-complex-mixed-portfolio.json` for comprehensive testing
4. **Test Recent Data**: Use `07-recent-buyer.json` for current year testing
5. **Test Exporting**: After importing, try exporting to see the export format

## Error Handling

If an import fails:
- Check that the JSON is valid (use a JSON validator)
- Ensure dates are in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Verify property IDs match between properties and events
- Check that event types are valid
- Review browser console for detailed error messages

## Creating Your Own Test Files

You can create custom test files following either format above. Key points:

1. All dates must be ISO 8601 strings
2. Property IDs in events must match property IDs in properties array
3. Event types must be one of the supported types
4. Colors should be valid hex codes (e.g., `#3B82F6`)
5. Property status should be one of: `ppr`, `rental`, `vacant`, `construction`, `sold`

## Export and Re-import

You can export your timeline data and re-import it later:

1. Click the **Download** button (📥 icon) to export
2. The exported file will use Format 2 (Property History)
3. This file can be re-imported using the **Upload** button

---

**Note**: All test files are example data for testing purposes only.
