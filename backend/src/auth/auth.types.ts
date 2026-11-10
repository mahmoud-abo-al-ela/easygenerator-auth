/** The authenticated principal attached to `request.user` by JwtAuthGuard. */
export interface AuthUser {
  id: string;
}

export interface JwtPayload {
  sub: string;
}
