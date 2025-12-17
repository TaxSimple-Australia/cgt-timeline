"""Test data fixtures for CGT Brain API tests."""

from datetime import date
from decimal import Decimal

from app.models import PropertyTimeline, PropertyEvent, EventType


# Simple main residence - full exemption scenario
SIMPLE_MAIN_RESIDENCE = PropertyTimeline(
    property_address="10 Smith Street, Melbourne VIC 3000",
    property_type="house",
    acquisition_date=date(2015, 6, 1),
    acquisition_cost=Decimal("600000"),
    disposal_date=date(2024, 6, 1),
    disposal_proceeds=Decimal("950000"),
    events=[
        PropertyEvent(
            event_type=EventType.PURCHASE,
            event_date=date(2015, 6, 1),
            description="Purchased as family home",
            amount=Decimal("600000"),
        ),
        PropertyEvent(
            event_type=EventType.MOVE_IN,
            event_date=date(2015, 6, 15),
            description="Moved in as main residence",
        ),
        PropertyEvent(
            event_type=EventType.SALE,
            event_date=date(2024, 6, 1),
            description="Sold property",
            amount=Decimal("950000"),
        ),
    ],
    owner_name="Jane Doe",
    ownership_percentage=Decimal("100"),
    is_pre_cgt=False,
    cost_base_additions=Decimal("25000"),
)


# Partial main residence - property was rented for part of ownership
PARTIAL_MAIN_RESIDENCE = PropertyTimeline(
    property_address="45 Beach Road, Sydney NSW 2000",
    property_type="apartment",
    acquisition_date=date(2016, 3, 15),
    acquisition_cost=Decimal("750000"),
    disposal_date=date(2024, 9, 30),
    disposal_proceeds=Decimal("1100000"),
    events=[
        PropertyEvent(
            event_type=EventType.PURCHASE,
            event_date=date(2016, 3, 15),
            description="Purchased apartment",
            amount=Decimal("750000"),
        ),
        PropertyEvent(
            event_type=EventType.MOVE_IN,
            event_date=date(2016, 4, 1),
            description="Moved in as main residence",
        ),
        PropertyEvent(
            event_type=EventType.MOVE_OUT,
            event_date=date(2020, 1, 31),
            description="Relocated interstate for work",
        ),
        PropertyEvent(
            event_type=EventType.RENT_START,
            event_date=date(2020, 2, 15),
            description="Started renting property",
        ),
        PropertyEvent(
            event_type=EventType.RENT_END,
            event_date=date(2024, 8, 31),
            description="Tenant vacated",
        ),
        PropertyEvent(
            event_type=EventType.SALE,
            event_date=date(2024, 9, 30),
            description="Sold property",
            amount=Decimal("1100000"),
        ),
    ],
    owner_name="Michael Chen",
    ownership_percentage=Decimal("100"),
    is_pre_cgt=False,
    cost_base_additions=Decimal("35000"),
)


# Absence rule scenario - rented within 6 years
ABSENCE_RULE_WITHIN_6_YEARS = PropertyTimeline(
    property_address="22 Park Avenue, Brisbane QLD 4000",
    property_type="townhouse",
    acquisition_date=date(2017, 8, 1),
    acquisition_cost=Decimal("550000"),
    disposal_date=date(2024, 7, 15),
    disposal_proceeds=Decimal("780000"),
    events=[
        PropertyEvent(
            event_type=EventType.PURCHASE,
            event_date=date(2017, 8, 1),
            description="Purchased townhouse",
            amount=Decimal("550000"),
        ),
        PropertyEvent(
            event_type=EventType.MOVE_IN,
            event_date=date(2017, 8, 15),
            description="Moved in as main residence",
        ),
        PropertyEvent(
            event_type=EventType.MOVE_OUT,
            event_date=date(2020, 6, 30),
            description="Moved overseas for work assignment",
        ),
        PropertyEvent(
            event_type=EventType.RENT_START,
            event_date=date(2020, 7, 15),
            description="Rented out while overseas",
        ),
        PropertyEvent(
            event_type=EventType.RENT_END,
            event_date=date(2024, 6, 30),
            description="Returned from overseas, tenant vacated",
        ),
        PropertyEvent(
            event_type=EventType.SALE,
            event_date=date(2024, 7, 15),
            description="Sold property",
            amount=Decimal("780000"),
        ),
    ],
    owner_name="Sarah Wilson",
    ownership_percentage=Decimal("100"),
    is_pre_cgt=False,
    cost_base_additions=Decimal("15000"),
)


# Investment property - no main residence exemption
INVESTMENT_PROPERTY = PropertyTimeline(
    property_address="Unit 5/100 CBD Street, Perth WA 6000",
    property_type="unit",
    acquisition_date=date(2018, 11, 1),
    acquisition_cost=Decimal("420000"),
    disposal_date=date(2024, 5, 15),
    disposal_proceeds=Decimal("510000"),
    events=[
        PropertyEvent(
            event_type=EventType.PURCHASE,
            event_date=date(2018, 11, 1),
            description="Purchased as investment",
            amount=Decimal("420000"),
        ),
        PropertyEvent(
            event_type=EventType.RENT_START,
            event_date=date(2018, 12, 1),
            description="First tenant moved in",
        ),
        PropertyEvent(
            event_type=EventType.RENOVATION,
            event_date=date(2021, 3, 15),
            description="Kitchen and bathroom renovation",
            amount=Decimal("28000"),
        ),
        PropertyEvent(
            event_type=EventType.RENT_END,
            event_date=date(2024, 4, 30),
            description="Property vacated for sale",
        ),
        PropertyEvent(
            event_type=EventType.SALE,
            event_date=date(2024, 5, 15),
            description="Sold property",
            amount=Decimal("510000"),
        ),
    ],
    owner_name="David Thompson",
    ownership_percentage=Decimal("100"),
    is_pre_cgt=False,
    cost_base_additions=Decimal("42000"),
)


# Inherited property scenario
INHERITED_PROPERTY = PropertyTimeline(
    property_address="8 Heritage Lane, Adelaide SA 5000",
    property_type="house",
    acquisition_date=date(2019, 4, 15),  # Date of death
    acquisition_cost=Decimal("680000"),  # Market value at death
    disposal_date=date(2024, 10, 1),
    disposal_proceeds=Decimal("820000"),
    events=[
        PropertyEvent(
            event_type=EventType.INHERITANCE,
            event_date=date(2019, 4, 15),
            description="Inherited from deceased parent",
            amount=Decimal("680000"),
        ),
        PropertyEvent(
            event_type=EventType.RENT_START,
            event_date=date(2019, 8, 1),
            description="Property rented out after probate",
        ),
        PropertyEvent(
            event_type=EventType.RENT_END,
            event_date=date(2024, 9, 1),
            description="Prepared for sale",
        ),
        PropertyEvent(
            event_type=EventType.SALE,
            event_date=date(2024, 10, 1),
            description="Sold inherited property",
            amount=Decimal("820000"),
        ),
    ],
    owner_name="Emma Brown",
    ownership_percentage=Decimal("100"),
    is_pre_cgt=False,
    cost_base_additions=Decimal("12000"),
)


# Pre-CGT property (acquired before 20 Sep 1985)
PRE_CGT_PROPERTY = PropertyTimeline(
    property_address="15 Historic Road, Hobart TAS 7000",
    property_type="house",
    acquisition_date=date(1982, 5, 10),
    acquisition_cost=Decimal("45000"),
    disposal_date=date(2024, 8, 1),
    disposal_proceeds=Decimal("890000"),
    events=[
        PropertyEvent(
            event_type=EventType.PURCHASE,
            event_date=date(1982, 5, 10),
            description="Purchased family home",
            amount=Decimal("45000"),
        ),
        PropertyEvent(
            event_type=EventType.MOVE_IN,
            event_date=date(1982, 6, 1),
            description="Moved in as main residence",
        ),
        PropertyEvent(
            event_type=EventType.SALE,
            event_date=date(2024, 8, 1),
            description="Sold after 42 years",
            amount=Decimal("890000"),
        ),
    ],
    owner_name="Robert Taylor",
    ownership_percentage=Decimal("100"),
    is_pre_cgt=True,
    cost_base_additions=Decimal("85000"),
)


# Joint ownership scenario
JOINT_OWNERSHIP = PropertyTimeline(
    property_address="33 Partner Way, Darwin NT 0800",
    property_type="house",
    acquisition_date=date(2019, 2, 1),
    acquisition_cost=Decimal("480000"),
    disposal_date=date(2024, 11, 15),
    disposal_proceeds=Decimal("620000"),
    events=[
        PropertyEvent(
            event_type=EventType.PURCHASE,
            event_date=date(2019, 2, 1),
            description="Purchased as joint tenants with spouse",
            amount=Decimal("480000"),
        ),
        PropertyEvent(
            event_type=EventType.MOVE_IN,
            event_date=date(2019, 2, 15),
            description="Moved in as main residence",
        ),
        PropertyEvent(
            event_type=EventType.SALE,
            event_date=date(2024, 11, 15),
            description="Sold property",
            amount=Decimal("620000"),
        ),
    ],
    owner_name="Lisa and Mark Johnson",
    ownership_percentage=Decimal("50"),  # Each owns 50%
    is_pre_cgt=False,
    cost_base_additions=Decimal("18000"),
)


# All test scenarios
ALL_TEST_SCENARIOS = {
    "simple_main_residence": SIMPLE_MAIN_RESIDENCE,
    "partial_main_residence": PARTIAL_MAIN_RESIDENCE,
    "absence_rule_within_6_years": ABSENCE_RULE_WITHIN_6_YEARS,
    "investment_property": INVESTMENT_PROPERTY,
    "inherited_property": INHERITED_PROPERTY,
    "pre_cgt_property": PRE_CGT_PROPERTY,
    "joint_ownership": JOINT_OWNERSHIP,
}
