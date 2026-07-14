from elasticsearch import AsyncElasticsearch
from app.config import get_settings

settings = get_settings()

# The Backend needs this 'es_client' for RCA and Log search
es_client = AsyncElasticsearch(
    hosts=settings.elasticsearch_hosts
)