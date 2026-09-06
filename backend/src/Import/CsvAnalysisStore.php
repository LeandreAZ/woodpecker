<?php
namespace App\Import;

use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final class CsvAnalysisStore
{
    public function __construct(
        #[Autowire(service: 'csv_import.cache')]
        private readonly CacheItemPoolInterface $cache,
    ) {
    }
    public function save(string $key, array $analysis): void
    {
        $item = $this->cache->getItem($key);
        $item->set($analysis);
        $this->cache->save($item);
    }
    public function get(string $key): ?array
    {
        $item = $this->cache->getItem($key);
        $value = $item->isHit() ? $item->get() : null;
        return is_array($value) ? $value : null;
    }
}
