from sqlalchemy import create_engine, TIMESTAMP, Column, Integer, String, Enum, DECIMAL, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Vehicle(Base):
    __tablename__ = 'vehicle'

    vehicle_id = Column(Integer, primary_key=True)
    model = Column(String(255), nullable=False)
    owner_id = Column(Integer, nullable=False)
    coordinates_lat = Column(DECIMAL(8, 6), nullable=False)
    coordinates_long = Column(DECIMAL(9, 6), nullable=False)
    status = Column(Enum('Active', 'Inactive', 'In Repair'), nullable=False)
    battery_percentage = Column(DECIMAL(5, 2), nullable=False)
    battery_health = Column(DECIMAL(5, 2), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint('battery_percentage >= 0 AND battery_percentage <= 100'),
        CheckConstraint('battery_health >= 0 AND battery_health <= 100')
    )
