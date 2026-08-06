"""
Optimized database queries for better performance
"""
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, func, text
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from ..database import Order, OrderItem, Dish, Person, Table

logger = logging.getLogger(__name__)

class OptimizedQueryService:
    """Service for optimized database queries with caching and performance improvements"""
    
    def __init__(self):
        self.query_cache = {}
        self.cache_ttl = {
            'menu': 300,  # 5 minutes
            'categories': 900,  # 15 minutes
            'specials': 300,  # 5 minutes
            'offers': 300,  # 5 minutes
        }
    
    def get_menu_optimized(self, db: Session, category: Optional[str] = None) -> List[Dict]:
        """Optimized menu query with eager loading and caching"""
        try:
            # Build optimized query
            query = db.query(Dish).filter(
                Dish.is_visible == True
            )
            
            if category and category != 'All':
                query = query.filter(Dish.category == category)
            
            # Order by category and name for consistent results
            query = query.order_by(Dish.category, Dish.name)
            
            # Execute query
            dishes = query.all()
            
            # Convert to dict for JSON serialization
            result = []
            for dish in dishes:
                dish_dict = {
                    'id': dish.id,
                    'name': dish.name,
                    'description': dish.description,
                    'price': float(dish.price),
                    'category': dish.category,
                    'image_path': dish.image_path,
                    'is_offer': dish.is_offer,
                    'discount': float(dish.discount) if dish.discount else 0,
                    'is_visible': dish.is_visible,
                    'created_at': dish.created_at.isoformat() if dish.created_at else None
                }
                result.append(dish_dict)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in get_menu_optimized: {str(e)}")
            raise
    
    def get_orders_optimized(self, db: Session, person_id: Optional[int] = None, 
                           table_number: Optional[int] = None, 
                           status: Optional[str] = None) -> List[Dict]:
        """Optimized order query with eager loading of related data"""
        try:
            # Build base query with eager loading
            query = db.query(Order).options(
                selectinload(Order.items).selectinload(OrderItem.dish),
                joinedload(Order.person)
            )
            
            # Apply filters
            filters = []
            if person_id:
                filters.append(Order.person_id == person_id)
            if table_number:
                filters.append(Order.table_number == table_number)
            if status:
                filters.append(Order.status == status)
            
            if filters:
                query = query.filter(and_(*filters))
            
            # Order by creation time (newest first)
            query = query.order_by(Order.created_at.desc())
            
            # Execute query
            orders = query.all()
            
            # Convert to dict with optimized serialization
            result = []
            for order in orders:
                order_dict = {
                    'id': order.id,
                    'table_number': order.table_number,
                    'unique_id': order.unique_id,
                    'person_id': order.person_id,
                    'status': order.status,
                    'created_at': order.created_at.isoformat() if order.created_at else None,
                    'updated_at': order.updated_at.isoformat() if order.updated_at else None,
                    'items': []
                }
                
                # Add order items
                for item in order.items:
                    item_dict = {
                        'id': item.id,
                        'dish_id': item.dish_id,
                        'dish_name': item.dish.name if item.dish else 'Unknown',
                        'quantity': item.quantity,
                        'price': float(item.price),
                        'remarks': item.remarks,
                        'position': item.position
                    }
                    order_dict['items'].append(item_dict)
                
                result.append(order_dict)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in get_orders_optimized: {str(e)}")
            raise
    
    def get_chef_orders_optimized(self, db: Session, status: str) -> List[Dict]:
        """Optimized chef order query with minimal data transfer"""
        try:
            # Use raw SQL for better performance on chef queries
            sql = text("""
                SELECT 
                    o.id,
                    o.table_number,
                    o.status,
                    o.created_at,
                    o.updated_at,
                    COUNT(oi.id) as item_count,
                    GROUP_CONCAT(
                        CONCAT(d.name, ' (', oi.quantity, ')')
                        SEPARATOR ', '
                    ) as items_summary
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN dishes d ON oi.dish_id = d.id
                WHERE o.status = :status
                GROUP BY o.id, o.table_number, o.status, o.created_at, o.updated_at
                ORDER BY o.created_at ASC
            """)
            
            result = db.execute(sql, {'status': status}).fetchall()
            
            # Convert to dict
            orders = []
            for row in result:
                order_dict = {
                    'id': row.id,
                    'table_number': row.table_number,
                    'status': row.status,
                    'created_at': row.created_at.isoformat() if row.created_at else None,
                    'updated_at': row.updated_at.isoformat() if row.updated_at else None,
                    'item_count': row.item_count,
                    'items_summary': row.items_summary or ''
                }
                orders.append(order_dict)
            
            return orders
            
        except Exception as e:
            logger.error(f"Error in get_chef_orders_optimized: {str(e)}")
            # Fallback to regular query
            return self._get_chef_orders_fallback(db, status)
    
    def _get_chef_orders_fallback(self, db: Session, status: str) -> List[Dict]:
        """Fallback method for chef orders if raw SQL fails"""
        try:
            orders = db.query(Order).options(
                selectinload(Order.items).selectinload(OrderItem.dish)
            ).filter(Order.status == status).order_by(Order.created_at.asc()).all()
            
            result = []
            for order in orders:
                items_summary = ', '.join([
                    f"{item.dish.name if item.dish else 'Unknown'} ({item.quantity})"
                    for item in order.items
                ])
                
                order_dict = {
                    'id': order.id,
                    'table_number': order.table_number,
                    'status': order.status,
                    'created_at': order.created_at.isoformat() if order.created_at else None,
                    'updated_at': order.updated_at.isoformat() if order.updated_at else None,
                    'item_count': len(order.items),
                    'items_summary': items_summary
                }
                result.append(order_dict)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in chef orders fallback: {str(e)}")
            raise
    
    def get_table_status_optimized(self, db: Session) -> List[Dict]:
        """Optimized table status query"""
        try:
            # Use raw SQL for better performance
            sql = text("""
                SELECT 
                    t.table_number,
                    t.is_occupied,
                    t.current_order_id,
                    t.updated_at,
                    o.status as order_status,
                    COUNT(oi.id) as item_count
                FROM tables t
                LEFT JOIN orders o ON t.current_order_id = o.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                GROUP BY t.table_number, t.is_occupied, t.current_order_id, t.updated_at, o.status
                ORDER BY t.table_number
            """)
            
            result = db.execute(sql).fetchall()
            
            tables = []
            for row in result:
                table_dict = {
                    'table_number': row.table_number,
                    'is_occupied': bool(row.is_occupied),
                    'current_order_id': row.current_order_id,
                    'updated_at': row.updated_at.isoformat() if row.updated_at else None,
                    'order_status': row.order_status,
                    'item_count': row.item_count or 0
                }
                tables.append(table_dict)
            
            return tables
            
        except Exception as e:
            logger.error(f"Error in get_table_status_optimized: {str(e)}")
            raise
    
    def get_analytics_data_optimized(self, db: Session, start_date: datetime, 
                                   end_date: datetime) -> Dict[str, Any]:
        """Optimized analytics query with aggregations"""
        try:
            # Use raw SQL for complex aggregations
            sql = text("""
                SELECT 
                    DATE(o.created_at) as order_date,
                    COUNT(DISTINCT o.id) as total_orders,
                    COUNT(DISTINCT o.table_number) as unique_tables,
                    SUM(oi.quantity * oi.price) as total_revenue,
                    AVG(oi.quantity * oi.price) as avg_order_value,
                    d.category,
                    COUNT(oi.id) as items_sold
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN dishes d ON oi.dish_id = d.id
                WHERE o.created_at BETWEEN :start_date AND :end_date
                    AND o.status = 'paid'
                GROUP BY DATE(o.created_at), d.category
                ORDER BY order_date DESC, d.category
            """)
            
            result = db.execute(sql, {
                'start_date': start_date,
                'end_date': end_date
            }).fetchall()
            
            # Process results
            analytics = {
                'daily_stats': {},
                'category_stats': {},
                'summary': {
                    'total_orders': 0,
                    'total_revenue': 0,
                    'avg_order_value': 0
                }
            }
            
            for row in result:
                date_str = row.order_date.isoformat()
                
                if date_str not in analytics['daily_stats']:
                    analytics['daily_stats'][date_str] = {
                        'orders': row.total_orders,
                        'revenue': float(row.total_revenue),
                        'avg_value': float(row.avg_order_value),
                        'unique_tables': row.unique_tables
                    }
                
                category = row.category
                if category not in analytics['category_stats']:
                    analytics['category_stats'][category] = {
                        'items_sold': 0,
                        'revenue': 0
                    }
                
                analytics['category_stats'][category]['items_sold'] += row.items_sold
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error in get_analytics_data_optimized: {str(e)}")
            raise

# Create singleton instance
optimized_queries = OptimizedQueryService()
