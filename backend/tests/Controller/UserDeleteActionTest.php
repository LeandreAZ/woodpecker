<?php

namespace App\Tests\Controller;

use App\Controller\UserDeleteAction;
use App\Entity\AuthenticationEvent;
use App\Entity\Training;
use App\Entity\User;
use App\Entity\UserPreference;
use App\Repository\AuthenticationEventRepository;
use App\Repository\TrainingRepository;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserDeleteActionTest extends TestCase
{
    private Security&MockObject $security;
    private EntityManagerInterface&MockObject $entityManager;
    private UserPasswordHasherInterface&MockObject $passwordHasher;
    private TrainingRepository&MockObject $trainingRepository;
    private AuthenticationEventRepository&MockObject $authenticationEventRepository;
    private UserDeleteAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->authenticationEventRepository = $this->createMock(AuthenticationEventRepository::class);

        $this->action = new UserDeleteAction(
            $this->security,
            $this->entityManager,
            $this->passwordHasher,
            $this->trainingRepository,
            $this->authenticationEventRepository,
        );
    }

    public function testDeletesUserAndRelatedDevelopmentData(): void
    {
        $user = (new User())
            ->setEmail('owner@example.com')
            ->setPseudonym('Owner');
        $preference = (new UserPreference())->setUser($user)->setDisplayName('Owner');
        $user->setPreference($preference);
        $event = (new AuthenticationEvent())->setUser($user);
        $training = (new Training())->setName('Mate en 2')->setOwner($user);

        $request = Request::create('/api/users/me', 'DELETE', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'owner@example.com',
            'currentPassword' => 'secret123',
        ], JSON_THROW_ON_ERROR));

        $removed = [];

        $this->security->method('getUser')->willReturn($user);
        $this->passwordHasher->method('isPasswordValid')->with($user, 'secret123')->willReturn(true);
        $this->authenticationEventRepository->method('findBy')->with(['user' => $user])->willReturn([$event]);
        $this->trainingRepository->method('findOwnedByUserOrdered')->with($user)->willReturn([$training]);
        $this->entityManager->expects(self::exactly(4))->method('remove')->willReturnCallback(function (object $entity) use (&$removed): void {
            $removed[] = $entity::class;
        });
        $this->entityManager->expects(self::once())->method('flush');

        $response = $this->action->__invoke($request);

        self::assertSame(204, $response->getStatusCode());
        self::assertSame([
            AuthenticationEvent::class,
            Training::class,
            UserPreference::class,
            User::class,
        ], $removed);
    }
}
