<?php
namespace App\Import;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
final class PuzzleImportValidationException extends UnprocessableEntityHttpException
{
    /** @param list<array{line: int, message: string}> $errors */
    public function __construct(public readonly array $errors) { parent::__construct('Le fichier contient des puzzles invalides.'); }
}
