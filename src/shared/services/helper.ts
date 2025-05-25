import { EntityManager, FindManyOptions, In, Repository } from 'typeorm';
import { randomBytes } from 'crypto'
import { UnauthorizedException } from '@nestjs/common';

export const constructResponse = (
  success: boolean,
  data: any,
  statusCode = 200,
) => {
  return {
    success,
    data,
    statusCode,
  };
};

interface PaginationOptionInterface {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T = void> {
  data: Array<T>;
  page: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
}


export function paginate<T>(
  repository,
  options?: FindManyOptions<T>,
  config?: PaginationOptionInterface,
): Promise<PaginationResult<T>> {
  config = config || {};
  const page = Number(config.page) || 1;
  const take = Number(config.limit) || 20;
  const skip = (page - 1) * take;

  //If limit is '-1' return all rows
  const findOptions =
    Number(config.limit) === -1
      ? {
        ...options,
      }
      : {
        ...options,
        take,
        skip,
      };
  return repository
    .findAndCount(findOptions)
    .then((result) => {
      const data = result[0],
        totalItems = result[1],
        itemsPerPage = (take === -1) ? result[1] : take,
        currentPage = page,
        totalPages = (take === -1) ? 1 : Math.ceil(totalItems / take);
      return {
        data,
        page: {
          totalItems,
          itemsPerPage,
          currentPage,
          totalPages,
        },
      };
    });
}

export async function validateUser(email: Array<string>, entityManager: EntityManager) {
    
    const query = await entityManager.query(
        'SELECT * FROM Users WHERE email = ANY($1)',
        [email]);

    if (!query) throw new UnauthorizedException('user not found');
    return query;
}

