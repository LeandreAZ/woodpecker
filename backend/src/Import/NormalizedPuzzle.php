<?php
namespace App\Import;
final readonly class NormalizedPuzzle
{
    /** @param list<string> $solution @param list<string> $themes */
    public function __construct(public ?string $sourceId, public string $fen, public array $solution, public int $rating, public array $themes, public array $openingTags = []) {}
    public function fingerprint(): string { return hash('sha256', $this->fen.'|'.implode(' ', $this->solution)); }
}
